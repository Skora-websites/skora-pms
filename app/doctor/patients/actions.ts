"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";
import { hashPassword } from "@/lib/auth/password";
import { ensurePatientOfDoctor } from "@/lib/auth/ownership";
import { audit } from "@/lib/security/audit-log";
import { patientSchema } from "@/lib/validation";

export type PatientActionResult = { error: string | null };

// Profile photos are stored outside public/ (PHI-safe); served via authenticated route.
const PHOTO_DIR = path.join(process.cwd(), "storage", "uploads", "patient-photos");

async function getDoctorId(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["doctor", "receptionist", "admin"].includes(user.role)) redirect("/login");
  return user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
}

/** Magic-byte check — only real JPEG/PNG/WEBP images pass (spoofed extensions rejected). */
function sniffImage(bytes: Buffer): "jpg" | "png" | "webp" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString("latin1") === "RIFF" && bytes.subarray(8, 12).toString("latin1") === "WEBP") return "webp";
  return null;
}

async function savePhoto(file: File): Promise<string | null> {
  if (file.size === 0) return null;
  if (file.size > 2 * 1024 * 1024) throw new Error("Photo must be under 2 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) throw new Error("Only JPG, PNG or WEBP images are allowed.");
  const filename = `${crypto.randomUUID()}.${kind}`;
  await fs.mkdir(PHOTO_DIR, { recursive: true });
  await fs.writeFile(path.join(PHOTO_DIR, filename), bytes);
  return `patient-photos/${filename}`;
}

async function deletePhoto(storedPath: string | null) {
  if (!storedPath) return;
  const absolute = path.join(process.cwd(), "storage", "uploads", storedPath);
  fs.unlink(absolute).catch(() => undefined);
}

/** Generate a unique PAT+7digit registration id (mirrors legacy `store`). */
async function generateRegistrationId(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const regid = `PAT${Math.floor(1000000 + Math.random() * 9000000)}`;
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.registrationId, regid));
    if (!existing) return regid;
  }
  throw new Error("Could not generate a unique registration ID.");
}

export async function createPatient(
  _prev: PatientActionResult,
  formData: FormData
): Promise<PatientActionResult> {
  const doctorId = await getDoctorId();
  const now = new Date();

  const parsed = patientSchema.safeParse({
    referredBy: String(formData.get("referred_by") ?? "").trim() || undefined,
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    gender: String(formData.get("gender") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    dob: String(formData.get("dob") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    pincode: String(formData.get("pincode") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    state: String(formData.get("state") ?? "").trim(),
    streetAddress: String(formData.get("street_address") ?? "").trim(),
    salutation: String(formData.get("salutation") ?? "").trim(),
    aadhaarNo: String(formData.get("aadhaar_no") ?? "").trim(),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const email = data.email || null;
  if (email) {
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (existing) return { error: "A patient with this email already exists." };
  }

  let photoPath: string | null = null;
  const photo = formData.get("profile_photo") as File | null;
  if (photo && photo.size > 0) {
    try {
      photoPath = await savePhoto(photo);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Invalid photo." };
    }
  }

  const regid = await generateRegistrationId();
  const password = crypto.randomBytes(8).toString("base64url"); // 10-char random (legacy: Str::random(10))
  const hashed = await hashPassword(password);

  const [result] = await db.insert(users).values({
    role: "patient",
    registrationId: regid,
    referenceRoleId: doctorId,
    referredBy: data.referredBy || null,
    name: data.name,
    email,
    password: hashed,
    gender: data.gender,
    phone: data.phone,
    dob: data.dob || null,
    address: data.address || null,
    pincode: data.pincode ? Number(data.pincode) : null,
    city: data.city || null,
    state: data.state || null,
    streetAddress: data.streetAddress || null,
    salutation: data.salutation || null,
    aadhaarNo: data.aadhaarNo || null,
    profilePhotoPath: photoPath,
    status: "active",
    createdAt: now,
    updatedAt: now,
  });

  const userId = Number(result.insertId);

  void audit.patientCreated(doctorId, {
    patientId: userId,
    registrationId: regid,
    name: data.name,
    gender: data.gender,
  });

  revalidatePath("/doctor/patients");
  redirect(`/doctor/patients/${userId}`);
}

export async function updatePatient(
  _prev: PatientActionResult,
  formData: FormData
): Promise<PatientActionResult> {
  const doctorId = await getDoctorId();
  const patientId = Number(formData.get("patient_id"));

  if (!Number.isInteger(patientId) || patientId <= 0) return { error: "Invalid patient." };
  if (!(await ensurePatientOfDoctor(doctorId, patientId))) return { error: "Patient not found." };

  const parsed = patientSchema.safeParse({
    referredBy: String(formData.get("referred_by") ?? "").trim() || undefined,
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    gender: String(formData.get("gender") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    dob: String(formData.get("dob") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    pincode: String(formData.get("pincode") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    state: String(formData.get("state") ?? "").trim(),
    streetAddress: String(formData.get("street_address") ?? "").trim(),
    salutation: String(formData.get("salutation") ?? "").trim(),
    aadhaarNo: String(formData.get("aadhaar_no") ?? "").trim(),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  const email = data.email || null;
  if (email) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), ne(users.id, patientId)));
    if (existing) return { error: "A patient with this email already exists." };
  }

  const [current] = await db
    .select({ profilePhotoPath: users.profilePhotoPath })
    .from(users)
    .where(eq(users.id, patientId));

  let photoPath: string | null = current?.profilePhotoPath ?? null;
  const photo = formData.get("profile_photo") as File | null;
  if (photo && photo.size > 0) {
    try {
      photoPath = await savePhoto(photo);
      if (current?.profilePhotoPath && current.profilePhotoPath !== photoPath) {
        await deletePhoto(current.profilePhotoPath);
      }
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Invalid photo." };
    }
  }

  await db
    .update(users)
    .set({
      referredBy: data.referredBy || null,
      name: data.name,
      email,
      gender: data.gender,
      phone: data.phone,
      dob: data.dob || null,
      address: data.address || null,
      pincode: data.pincode ? Number(data.pincode) : null,
      city: data.city || null,
      state: data.state || null,
      streetAddress: data.streetAddress || null,
      salutation: data.salutation || null,
      aadhaarNo: data.aadhaarNo || null,
      profilePhotoPath: photoPath,
      updatedAt: new Date(),
    })
    .where(and(eq(users.id, patientId), eq(users.referenceRoleId, doctorId)));

  void audit.patientUpdated(doctorId, {
    patientId,
    name: data.name,
    photoChanged: Boolean(photo && photo.size > 0),
  });

  revalidatePath("/doctor/patients");
  revalidatePath(`/doctor/patients/${patientId}`);
  redirect(`/doctor/patients/${patientId}`);
}

export async function deletePatient(patientId: number) {
  const doctorId = await getDoctorId();
  if (!Number.isInteger(patientId) || patientId <= 0) return;
  if (!(await ensurePatientOfDoctor(doctorId, patientId))) return;

  const [patient] = await db
    .select({ profilePhotoPath: users.profilePhotoPath })
    .from(users)
    .where(eq(users.id, patientId));

  // Hard delete (legacy parity); dependent records cascade or set null via FK.
  await db.delete(users).where(and(eq(users.id, patientId), eq(users.referenceRoleId, doctorId)));
  await deletePhoto(patient?.profilePhotoPath ?? null);

  void audit.patientDeleted(doctorId, { patientId });
  revalidatePath("/doctor/patients");
  redirect("/doctor/patients");
}
