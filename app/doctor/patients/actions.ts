"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { and, eq, isNull, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, consultations, billings } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { requireDoctorPermission } from "@/lib/auth/server-permissions";
import { ensurePatientOfDoctor } from "@/lib/auth/ownership";
import { audit } from "@/lib/security/audit-log";
import { patientSchema } from "@/lib/validation";
import { isDupKey, dupKeyConstraint } from "@/lib/db/dup";

export type PatientActionResult = { error: string | null };

// Profile photos are stored outside public/ (PHI-safe); served via authenticated route.
const PHOTO_DIR = path.join(process.cwd(), "storage", "uploads", "patient-photos");

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

/** Insert a patient, retrying with a fresh PAT id when the registration_id unique key collides (concurrent create race). */
async function insertPatient(
  values: typeof users.$inferInsert
): Promise<{ ok: true; userId: number; registrationId: string } | { ok: false; error: string }> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const regid = `PAT${Math.floor(1000000 + Math.random() * 9000000)}`;
    try {
      const [result] = await db
        .insert(users)
        .values({ ...values, registrationId: regid })
        .$returningId();
      return { ok: true, userId: Number(result.id), registrationId: regid };
    } catch (err) {
      if (attempt < 4 && isDupKey(err) && dupKeyConstraint(err) === "users_registration_id_unique") continue;
      // patients_registration_id_unique → registration-id collision; other dup keys (email) must not retry.
      if (isDupKey(err) && dupKeyConstraint(err) !== "users_registration_id_unique") {
        return { ok: false, error: "A patient with this email already exists." };
      }
      throw err;
    }
  }
  return { ok: false, error: "Could not generate a unique registration ID." };
}

export async function createPatient(
  _prev: PatientActionResult,
  formData: FormData
): Promise<PatientActionResult> {
  const doctorId = await requireDoctorPermission("registrations-create");
  if (!doctorId) return { error: "You don't have permission to register patients." };
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

  const password = crypto.randomBytes(8).toString("base64url"); // 10-char random (legacy: Str::random(10))
  const hashed = await hashPassword(password);

  const inserted = await insertPatient({
    role: "patient",
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
  if (!inserted.ok) return { error: inserted.error };

  void audit.patientCreated(doctorId, {
    patientId: inserted.userId,
    registrationId: inserted.registrationId,
    name: data.name,
    gender: data.gender,
  });

  revalidatePath("/doctor/patients");
  redirect(`/doctor/patients/${inserted.userId}`);
}

export async function updatePatient(
  _prev: PatientActionResult,
  formData: FormData
): Promise<PatientActionResult> {
  const doctorId = await requireDoctorPermission("registrations-edit");
  if (!doctorId) return { error: "You don't have permission to edit patients." };
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

  try {
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
  } catch (err) {
    if (isDupKey(err) && dupKeyConstraint(err) === "users_email_unique") {
      return { error: "A patient with this email already exists." };
    }
    throw err;
  }

  void audit.patientUpdated(doctorId, {
    patientId,
    name: data.name,
    photoChanged: Boolean(photo && photo.size > 0),
  });

  revalidatePath("/doctor/patients");
  revalidatePath(`/doctor/patients/${patientId}`);
  redirect(`/doctor/patients/${patientId}`);
}

export async function deletePatient(patientId: number): Promise<PatientActionResult | undefined> {
  const doctorId = await requireDoctorPermission("registrations-delete");
  if (!doctorId) return { error: "You don't have permission to delete patients." };
  if (!Number.isInteger(patientId) || patientId <= 0) return { error: "Invalid patient ID." };
  if (!(await ensurePatientOfDoctor(doctorId, patientId))) {
    return { error: "Patient not found for this doctor." };
  }

  // Business rule / data integrity: a patient with clinical or financial
  // records must not be hard-deleted — deleting the user row cascades to
  // their consultations, bills and test bookings (FK cascade), destroying
  // medicolegal and financial history. Deactivate instead (status toggle).
  let photoPath: string | null = null;
  try {
    await db.transaction(async (tx) => {
      const [clinical] = await tx
        .select({ id: consultations.id })
        .from(consultations)
        .where(and(eq(consultations.patientId, patientId), eq(consultations.doctorId, doctorId)))
        .limit(1);
      if (clinical) {
        throw new Error("This patient has consultation records. Deactivate the patient instead of deleting.");
      }
      const [financial] = await tx
        .select({ id: billings.id })
        .from(billings)
        .where(and(eq(billings.patientId, patientId), eq(billings.doctorId, doctorId), isNull(billings.deletedAt)))
        .limit(1);
      if (financial) {
        throw new Error("This patient has billing records. Deactivate the patient instead of deleting.");
      }

      const [patient] = await tx
        .select({ profilePhotoPath: users.profilePhotoPath })
        .from(users)
        .where(eq(users.id, patientId));
      photoPath = patient?.profilePhotoPath ?? null;

      // Hard delete only for patients with no clinical/financial history.
      await tx.delete(users).where(and(eq(users.id, patientId), eq(users.referenceRoleId, doctorId)));
    });
  } catch (err) {
    if (err instanceof Error && (err.message.includes("consultation records") || err.message.includes("billing records"))) {
      return { error: err.message };
    }
    throw err;
  }
  await deletePhoto(photoPath);

  void audit.patientDeleted(doctorId, { patientId });
  revalidatePath("/doctor/patients");
  redirect("/doctor/patients");
}
