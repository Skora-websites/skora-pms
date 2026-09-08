"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { and, asc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import ExcelJS from "exceljs";
import { db } from "@/lib/db";
import {
  users,
  doctorClinics,
  doctorSchedules,
  categories,
  blogs,
  blogImages,
  symptoms,
  examinations,
  diagnoses,
  labTests,
  medicines,
  supportTickets,
  supportVideos,
  landingSections,
  landingItems,
  mailSettings,
  companySettings,
  permissions,
  modelHasPermissions,
  roles,
  modelHasRoles,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";
import { DEFAULT_DOCTOR_MODULE_PERMS } from "@/lib/auth/server-permissions";
import { isDupKey, dupKeyConstraint } from "@/lib/db/dup";
import { hashPassword } from "@/lib/auth/password";
import { audit } from "@/lib/security/audit-log";
import { encryptSecret } from "@/lib/security/crypto";
import { revokeAllSessionsForUser } from "@/lib/auth/session";
import { sendMail } from "@/lib/mail/send";
import { slugify } from "@/lib/utils";

export type AdminActionResult = { error: string | null };

const USER_MODEL = "App\\Models\\User";
const ROLE_PREFIX: Record<string, string> = {
  doctor: "DOC",
  patient: "PAT",
  receptionist: "REC",
  admin: "ADM",
  super_admin: "SUP",
};
const SYSTEM_ROLE_BY_ROLE: Record<string, string> = {
  doctor: "Doctor",
  receptionist: "Receptionist",
  super_admin: "Super Admin",
};
const VALID_ROLES = ["super_admin", "admin", "doctor", "receptionist", "patient"];
const VALID_STATUSES = ["active", "inactive"];
const UPLOAD_ROOT = path.join(process.cwd(), "storage", "uploads");
const DATE_SAFE = /^[a-zA-Z0-9._/-]+$/;

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["super_admin", "admin"].includes(user.role)) redirect("/login");
  return user;
}

// ── File helpers (mirror doctor schedule actions) ───────────────────────────

function sniffImage(bytes: Buffer): "jpg" | "png" | "webp" | "gif" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "png";
  }
  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("latin1") === "RIFF" &&
    bytes.subarray(8, 12).toString("latin1") === "WEBP"
  ) {
    return "webp";
  }
  if (
    bytes.length >= 6 &&
    (bytes.subarray(0, 6).toString("latin1") === "GIF87a" ||
      bytes.subarray(0, 6).toString("latin1") === "GIF89a")
  ) {
    return "gif";
  }
  return null;
}

async function saveImage(file: File, subdir: string, maxBytes = 2 * 1024 * 1024): Promise<string> {
  if (!file || file.size === 0) throw new Error("Image file is missing.");
  if (file.size > maxBytes) throw new Error("Image must be under 2 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) throw new Error("Only JPG, PNG, WEBP or GIF images are allowed.");
  const dir = path.join(UPLOAD_ROOT, subdir);
  const filename = `${crypto.randomUUID()}.${kind}`;
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), bytes);
  return `${subdir}/${filename}`;
}

/** Sniff real video containers from magic bytes (extension can be spoofed). */
function sniffVideo(bytes: Buffer): "mp4" | "webm" | "mov" | "m4v" | null {
  if (bytes.length < 12) return null;
  // MP4/MOV/M4V are ISO-BMFF: bytes 4-7 are "ftyp", 8-11 the brand.
  if (bytes.subarray(4, 8).toString("latin1") === "ftyp") {
    const brand = bytes.subarray(8, 12).toString("latin1");
    if (/qt\s/.test(brand)) return "mov";
    return "mp4"; // covers mp4 + m4v brands
  }
  // WebM/MKV are EBML: 1A 45 DF A3.
  if (
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3
  ) {
    return "webm";
  }
  return null;
}

async function saveVideo(file: File): Promise<string> {
  if (!file || file.size === 0) throw new Error("Video file is missing.");
  if (file.size > 200 * 1024 * 1024) throw new Error("Video must be under 200 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = sniffVideo(bytes);
  if (!kind) throw new Error("Only MP4, WEBM, MOV or M4V videos are allowed.");
  const dir = path.join(UPLOAD_ROOT, "support-videos");
  const filename = `${crypto.randomUUID()}.${kind}`;
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), bytes);
  return `support-videos/${filename}`;
}

async function deleteUpload(storedPath: string | null) {
  // Legacy rows may store "uploads/clinic/x.jpg" — normalize before guarding.
  const relative = storedPath?.replace(/^uploads\//, "") ?? null;
  if (!relative || !DATE_SAFE.test(relative)) return;
  fs.unlink(path.join(UPLOAD_ROOT, relative)).catch(() => undefined);
}

// ── User management (legacy `SuperAdminController` parity) ──────────────────

function computeNextRegistrationId(role: string, rows: { registrationId: string | null }[]): string {
  const prefix = ROLE_PREFIX[role];
  if (!prefix) return "";
  let max = 0;
  for (const r of rows) {
    const n = Number.parseInt((r.registrationId ?? "").slice(prefix.length + 1), 10);
    if (Number.isInteger(n) && n > max) max = n;
  }
  return `${prefix}-${String(max + 1).padStart(4, "0")}`;
}

/** Pick the next DOC-xxxx/PAT-xxxx/… id; the users unique key is the final arbiter under concurrency. */
async function nextRegistrationId(role: string): Promise<string> {
  const rows = await db
    .select({ registrationId: users.registrationId })
    .from(users)
    .where(sql`${users.registrationId} LIKE ${`${ROLE_PREFIX[role]}-%`}`);
  return computeNextRegistrationId(role, rows);
}

async function syncSystemRole(userId: number, role: string) {
  const roleName = SYSTEM_ROLE_BY_ROLE[role];
  if (!roleName) return;
  const [systemRole] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(and(eq(roles.name, roleName), isNull(roles.doctorId)));
  if (!systemRole) return;
  await db
    .delete(modelHasRoles)
    .where(and(eq(modelHasRoles.modelId, userId), eq(modelHasRoles.modelType, USER_MODEL)));
  await db.insert(modelHasRoles).values({ roleId: systemRole.id, modelId: userId, modelType: USER_MODEL });
}

async function getTrialDays(): Promise<number> {
  const [company] = await db.select().from(companySettings).limit(1);
  return company?.defaultTrialDays ?? 15;
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Attach the system role + default doctor permissions inside a transaction. */
async function grantNewUserRole(tx: Tx, userId: number, role: string): Promise<void> {
  const roleName = SYSTEM_ROLE_BY_ROLE[role];
  if (roleName) {
    const [systemRole] = await tx
      .select({ id: roles.id })
      .from(roles)
      .where(and(eq(roles.name, roleName), isNull(roles.doctorId)));
    if (systemRole) {
      await tx.insert(modelHasRoles).values({ roleId: systemRole.id, modelId: userId, modelType: USER_MODEL });
    }
  }
  if (role === "doctor") {
    // Legacy parity gap: the Doctor system role has no permissions, so an
    // admin-created doctor could sign in but never reach the dashboard.
    const permRows = await tx
      .select({ id: permissions.id })
      .from(permissions)
      .where(inArray(permissions.name, DEFAULT_DOCTOR_MODULE_PERMS));
    if (permRows.length > 0) {
      await tx.insert(modelHasPermissions).values(
        permRows.map((p) => ({ permissionId: p.id, modelType: USER_MODEL, modelId: userId }))
      );
    }
  }
}

/** Admin user creation: user row + role + perms atomically, with registration-id collision retry. */
async function insertAdminUser(input: {
  name: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  role: string;
  status: string;
  qualification: string | null;
  registrationNumber: string | null;
  trialEndsAt?: Date;
  retries: number;
}): Promise<{ userId: number; registrationId: string }> {
  let attempt = 0;
  for (;;) {
    const registrationId = await nextRegistrationId(input.role);
    try {
      const userId = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(users)
          .values({
            name: input.name,
            email: input.email,
            phone: input.phone,
            password: input.passwordHash,
            role: input.role as never,
            status: input.status as never,
            qualification: input.qualification,
            registrationNumber: input.registrationNumber,
            registrationId: registrationId || null,
            trialEndsAt: input.trialEndsAt,
            emailVerifiedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .$returningId();
        const newUserId = Number(created.id);
        await grantNewUserRole(tx, newUserId, input.role);
        return newUserId;
      });
      return { userId, registrationId };
    } catch (err) {
      // Concurrent admin create grabbed the same next id — recompute and retry.
      if (attempt++ < input.retries && isDupKey(err) && dupKeyConstraint(err) === "users_registration_id_unique") {
        continue;
      }
      // Email collision (pre-checked but racy) — surface the friendly error.
      if (isDupKey(err) && dupKeyConstraint(err) === "users_email_unique") {
        throw new Error("A user with this email already exists.");
      }
      throw err;
    }
  }
}

export async function storeUser(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "");
  const status = String(formData.get("status") ?? "active");
  const qualification = String(formData.get("qualification") ?? "").trim();
  const registrationNumber = String(formData.get("registration_number") ?? "").trim();

  if (!name) return { error: "Name is required." };
  if (name.length > 255) return { error: "Name must be at most 255 characters." };
  if (!email) return { error: "Email is required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  if (!VALID_ROLES.includes(role)) return { error: "Invalid role." };
  if (!VALID_STATUSES.includes(status)) return { error: "Invalid status." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const [emailTaken] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (emailTaken) return { error: "A user with this email already exists." };

  const passwordHash = await hashPassword(password);
  const trialEndsAt =
    role === "doctor"
      ? new Date(Date.now() + (await getTrialDays()) * 24 * 60 * 60 * 1000)
      : undefined;

  // Insert + role attach + permission grants in ONE transaction, retrying
  // the whole thing with a fresh registration id when concurrent admin
  // creates collide on the unique key.
  const { userId, registrationId } = await insertAdminUser({
    name,
    email,
    phone: phone || null,
    passwordHash,
    role,
    status,
    qualification: qualification || null,
    registrationNumber: registrationNumber || null,
    trialEndsAt,
    retries: 3,
  });

  void audit.roleChanged(admin.id, { action: "user_created", userId, role, registrationId });

  revalidatePath("/super-admin/users");
  return { error: null };
}

export async function updateUser(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const userId = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "");
  const status = String(formData.get("status") ?? "active");
  const qualification = String(formData.get("qualification") ?? "").trim();
  const registrationNumber = String(formData.get("registration_number") ?? "").trim();
  const trialEndsAtRaw = String(formData.get("trial_ends_at") ?? "").trim();

  if (!Number.isInteger(userId)) return { error: "Invalid user ID." };
  if (!name) return { error: "Name is required." };
  if (!email) return { error: "Email is required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  if (!VALID_ROLES.includes(role)) return { error: "Invalid role." };
  if (!VALID_STATUSES.includes(status)) return { error: "Invalid status." };
  if (password && password.length < 8) return { error: "Password must be at least 8 characters." };

  const [existing] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      status: users.status,
      trialEndsAt: users.trialEndsAt,
    })
    .from(users)
    .where(eq(users.id, userId));
  if (!existing) return { error: "User not found." };

  // Security: never allow self-demotion or self-deactivation.
  if (userId === admin.id) {
    if (role !== existing.role) return { error: "You cannot change your own role." };
    if (status !== "active") return { error: "You cannot deactivate your own account." };
  }
  if (existing.role === "super_admin" && role !== "super_admin") {
    return { error: "You cannot change the role of a super admin." };
  }

  // Business rule: demoting/re-typing a doctor away from the doctor role would
  // orphan their patients (referenceRoleId), staff and clinics. Require
  // reassignment (deletion) first.
  if (existing.role === "doctor" && role !== "doctor") {
    const [dep] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.referenceRoleId, userId))
      .limit(1);
    if (dep) {
      return {
        error:
          "This doctor still has patients or staff linked to their practice. Reassign or delete them before changing the role.",
      };
    }
    const [clinic] = await db
      .select({ id: doctorClinics.id })
      .from(doctorClinics)
      .where(eq(doctorClinics.doctorId, userId))
      .limit(1);
    if (clinic) {
      return { error: "This doctor still has clinics. Delete the clinics before changing the role." };
    }
  }

  const [dup] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), ne(users.id, userId)));
  if (dup) return { error: "A user with this email already exists." };

  const isDoctorNow = role === "doctor";
  let trialEndsAt: Date | null = existing.trialEndsAt ?? null;
  if (trialEndsAtRaw) {
    const parsed = new Date(trialEndsAtRaw);
    if (Number.isNaN(parsed.getTime())) return { error: "Invalid trial end date." };
    trialEndsAt = parsed;
  } else if (isDoctorNow && !trialEndsAt) {
    trialEndsAt = new Date(Date.now() + (await getTrialDays()) * 24 * 60 * 60 * 1000);
  } else if (!isDoctorNow) {
    trialEndsAt = null;
  }

  await db
    .update(users)
    .set({
      name,
      email,
      phone: phone || null,
      role: role as never,
      status,
      qualification: qualification || null,
      registrationNumber: registrationNumber || null,
      trialEndsAt,
      password: password ? await hashPassword(password) : undefined,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  if (role !== existing.role) await syncSystemRole(userId, role);

  // Identity/credential/security changes invalidate every existing session
  // of that account (JWT itself stays cryptographically valid up to 7 days
  // otherwise — the sessions table is the only server-side kill switch).
  if (password || role !== existing.role || status !== existing.status) {
    await revokeAllSessionsForUser(userId);
    if (password) void audit.passwordChange(userId);
  }

  void audit.roleChanged(admin.id, { action: "user_updated", userId, role, status });

  revalidatePath("/super-admin/users");
  return { error: null };
}

export async function toggleUserStatus(userId: number): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!Number.isInteger(userId)) return { error: "Invalid user ID." };

  const [existing] = await db
    .select({ id: users.id, role: users.role, status: users.status })
    .from(users)
    .where(eq(users.id, userId));
  if (!existing) return { error: "User not found." };
  if (userId === admin.id) return { error: "You cannot deactivate your own account." };
  if (existing.role === "super_admin") return { error: "You cannot change the status of a super admin." };

  const nextStatus = existing.status === "active" ? "inactive" : "active";
  await db
    .update(users)
    .set({ status: nextStatus, updatedAt: new Date() })
    .where(eq(users.id, userId));

  // Deactivated accounts must not keep riding existing JWTs.
  if (nextStatus === "inactive") await revokeAllSessionsForUser(userId);

  void audit.roleChanged(admin.id, { action: "user_status_toggled", userId, status: nextStatus });

  revalidatePath("/super-admin/users");
  return { error: null };
}

// ── Doctor permissions sync (legacy `syncDoctorPermissions`) ────────────────

export async function saveDoctorPermissions(
  doctorId: number,
  permissionNames: string[]
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!Number.isInteger(doctorId)) return { error: "Invalid doctor ID." };

  const [doctor] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(and(eq(users.id, doctorId), eq(users.role, "doctor")));
  if (!doctor) return { error: "Doctor not found." };

  // Normalize the module hierarchy: selecting any child of a module
  // implies the module name itself (legacy parity).
  const all = await db.select().from(permissions);
  const names = new Set(permissionNames);
  const modules = all.filter((p) => p.parentId === null);
  for (const m of modules) {
    const children = all.filter((c) => c.parentId === m.id);
    if (children.some((c) => names.has(c.name))) names.add(m.name);
  }

  const selected = [...names];
  let permissionIds: number[] = [];
  if (selected.length > 0) {
    const rows = await db
      .select({ id: permissions.id })
      .from(permissions)
      .where(inArray(permissions.name, selected));
    permissionIds = rows.map((r) => r.id);
  }

  // Replace permissions atomically — a crash between delete and insert would
  // leave the doctor with no dashboard access at all.
  await db.transaction(async (tx) => {
    await tx
      .delete(modelHasPermissions)
      .where(and(eq(modelHasPermissions.modelId, doctorId), eq(modelHasPermissions.modelType, USER_MODEL)));
    if (permissionIds.length > 0) {
      await tx
        .insert(modelHasPermissions)
        .values(permissionIds.map((permissionId) => ({ permissionId, modelType: USER_MODEL, modelId: doctorId })));
    }
  });

  void audit.roleChanged(admin.id, {
    action: "doctor_permissions_saved",
    doctorId,
    doctorName: doctor.name,
    permissions: permissionIds.length,
  });

  revalidatePath("/super-admin/doctors");
  return { error: null };
}

// ── Clinic CRUD ─────────────────────────────────────────────────────────────

const ADDRESS_TYPES = ["manual", "map"] as const;

async function getClinicFormData(formData: FormData) {
  const doctorId = Number(formData.get("doctor_id"));
  const clinicName = String(formData.get("clinic_name") ?? "").trim();
  const addressType = String(formData.get("address_type") ?? "manual");
  const address = String(formData.get("address") ?? "").trim();
  const latitude = String(formData.get("latitude") ?? "").trim() || null;
  const longitude = String(formData.get("longitude") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim();
  const consultationFee = String(formData.get("consultation_fee") ?? "").trim();
  const isActive = formData.get("is_active") === "1" || formData.get("is_active") === "on";
  return { doctorId, clinicName, addressType, address, latitude, longitude, phone, consultationFee, isActive };
}

function validateClinicForm(f: Awaited<ReturnType<typeof getClinicFormData>>): string | null {
  if (!Number.isInteger(f.doctorId) || f.doctorId <= 0) return { error: "Select the owning doctor." }.error;
  if (!f.clinicName) return "Clinic name is required.";
  if (f.clinicName.length > 255) return "Clinic name must be at most 255 characters.";
  if (!(ADDRESS_TYPES as readonly string[]).includes(f.addressType)) return "Invalid address type.";
  if (f.addressType === "manual" && !f.address) return "Address is required for manual address.";
  if (f.addressType === "map" && (!f.latitude || !f.longitude)) {
    return "Latitude and longitude are required for map address.";
  }
  if (!f.phone) return "Phone is required.";
  if (f.phone.length > 20) return "Phone must be at most 20 characters.";
  const feeNum = Number(f.consultationFee);
  if (!f.consultationFee || !Number.isFinite(feeNum) || feeNum < 0) {
    return "Consultation fee must be a valid non-negative amount.";
  }
  return null;
}

export async function storeClinic(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const f = await getClinicFormData(formData);
  const invalid = validateClinicForm(f);
  if (invalid) return { error: invalid };

  const [doctor] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, f.doctorId), eq(users.role, "doctor")));
  if (!doctor) return { error: "Select the owning doctor." };

  let logoPath: string | null = null;
  const logo = formData.get("clinic_logo") as File | null;
  if (logo && logo.size > 0) {
    try {
      logoPath = await saveImage(logo, "clinic");
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Could not save the logo." };
    }
  }

  const [created] = await db
    .insert(doctorClinics)
    .values({
      doctorId: f.doctorId,
      clinicName: f.clinicName,
      addressType: f.addressType as never,
      address: f.addressType === "map" && !f.address ? `Map Location: ${f.latitude}, ${f.longitude}` : f.address,
      latitude: f.latitude,
      longitude: f.longitude,
      phone: f.phone,
      consultationFee: Number(f.consultationFee).toFixed(2),
      clinicLogo: logoPath,
      isActive: f.isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .$returningId();

  void audit.fileUploaded(admin.id, { action: "clinic_created", clinicId: Number(created.id), doctorId: f.doctorId });

  revalidatePath("/super-admin/clinics");
  return { error: null };
}

export async function updateClinic(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const clinicId = Number(formData.get("id"));
  if (!Number.isInteger(clinicId)) return { error: "Invalid clinic ID." };
  const f = await getClinicFormData(formData);
  const invalid = validateClinicForm(f);
  if (invalid) return { error: invalid };

  const [existing] = await db
    .select({ id: doctorClinics.id, clinicLogo: doctorClinics.clinicLogo })
    .from(doctorClinics)
    .where(eq(doctorClinics.id, clinicId));
  if (!existing) return { error: "Clinic not found." };

  const [doctor] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, f.doctorId), eq(users.role, "doctor")));
  if (!doctor) return { error: "Select the owning doctor." };

  let logoPath = existing.clinicLogo;
  const logo = formData.get("clinic_logo") as File | null;
  if (logo && logo.size > 0) {
    try {
      logoPath = await saveImage(logo, "clinic");
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Could not save the logo." };
    }
  }

  await db
    .update(doctorClinics)
    .set({
      doctorId: f.doctorId,
      clinicName: f.clinicName,
      addressType: f.addressType as never,
      address: f.addressType === "map" && !f.address ? `Map Location: ${f.latitude}, ${f.longitude}` : f.address,
      latitude: f.latitude,
      longitude: f.longitude,
      phone: f.phone,
      consultationFee: Number(f.consultationFee).toFixed(2),
      clinicLogo: logoPath,
      isActive: f.isActive,
      updatedAt: new Date(),
    })
    .where(eq(doctorClinics.id, clinicId));

  if (logoPath !== existing.clinicLogo) await deleteUpload(existing.clinicLogo);

  void audit.fileUploaded(admin.id, { action: "clinic_updated", clinicId, doctorId: f.doctorId });

  revalidatePath("/super-admin/clinics");
  return { error: null };
}

export async function deleteClinic(clinicId: number): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!Number.isInteger(clinicId)) return { error: "Invalid clinic ID." };

  const [existing] = await db
    .select({ id: doctorClinics.id, clinicLogo: doctorClinics.clinicLogo })
    .from(doctorClinics)
    .where(eq(doctorClinics.id, clinicId));
  if (!existing) return { error: "Clinic not found." };

  // Deactivate dependent schedules + delete clinic in one transaction;
  // appointments.clinic_id is FK ON DELETE SET NULL (Phase 2 migration),
  // so their rows survive with clinic_id nulled.
  await db.transaction(async (tx) => {
    await tx
      .update(doctorSchedules)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(doctorSchedules.doctorClinicId, clinicId));
    await tx.delete(doctorClinics).where(eq(doctorClinics.id, clinicId));
  });
  await deleteUpload(existing.clinicLogo);

  void audit.fileUploaded(admin.id, { action: "clinic_deleted", clinicId });

  revalidatePath("/super-admin/clinics");
  return { error: null };
}

// ── Master data CRUD (legacy `MasterController` parity) ─────────────────────

const MASTER_TABLES = {
  symptoms,
  examinations,
  diagnoses,
  "lab-tests": labTests,
  medicines,
} as const;
const MASTER_LABELS: Record<string, string> = {
  symptoms: "symptom",
  examinations: "examination",
  diagnoses: "diagnosis",
  "lab-tests": "lab test",
  medicines: "medicine",
};

function masterTable(kind: string) {
  return MASTER_TABLES[kind as keyof typeof MASTER_TABLES] as unknown as typeof symptoms | undefined;
}

export async function storeMasterItem(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const kind = String(formData.get("kind") ?? "");
  const table = masterTable(kind);
  if (!table) return { error: "Invalid master type." };
  const label = MASTER_LABELS[kind];

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: `The ${label} name is required.` };
  if (name.length > 255) return { error: `The ${label} name must be at most 255 characters.` };

  if (kind === "medicines") {
    const strength = String(formData.get("strength") ?? "").trim() || null;
    const form = String(formData.get("form") ?? "").trim() || "Tablet";
    const unit = String(formData.get("unit") ?? "").trim() || "mg";
    const [dup] = await db
      .select({ id: medicines.id })
      .from(medicines)
      .where(eq(medicines.name, name));
    if (dup) return { error: "A medicine with this name already exists." };
    await db.insert(medicines).values({ name, strength, form, unit, createdAt: new Date(), updatedAt: new Date() });
  } else {
    const [dup] = await db.select({ id: symptoms.id }).from(table).where(eq(table.name, name));
    if (dup) return { error: `A ${label} with this name already exists.` };
    await db.insert(table).values({ name, createdAt: new Date(), updatedAt: new Date() });
  }

  void audit.categoryCreated(admin.id, { action: "master_created", kind, name });

  revalidatePath("/super-admin/masters");
  return { error: null };
}

export async function updateMasterItem(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const kind = String(formData.get("kind") ?? "");
  const table = masterTable(kind);
  if (!table) return { error: "Invalid master type." };
  const label = MASTER_LABELS[kind];
  const itemId = Number(formData.get("id"));
  if (!Number.isInteger(itemId)) return { error: "Invalid ID." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: `The ${label} name is required.` };
  if (name.length > 255) return { error: `The ${label} name must be at most 255 characters.` };

  const [existing] = await db.select().from(table).where(eq(table.id, itemId));
  if (!existing) return { error: "Record not found." };

  const [dup] = await db
    .select({ id: table.id })
    .from(table)
    .where(and(eq(table.name, name), ne(table.id, itemId)));
  if (dup) return { error: `A ${label} with this name already exists.` };

  if (kind === "medicines") {
    const strength = String(formData.get("strength") ?? "").trim() || null;
    const form = String(formData.get("form") ?? "").trim() || "Tablet";
    const unit = String(formData.get("unit") ?? "").trim() || "mg";
    await db
      .update(medicines)
      .set({ name, strength, form, unit, updatedAt: new Date() })
      .where(eq(medicines.id, itemId));
  } else {
    await db.update(table).set({ name, updatedAt: new Date() }).where(eq(table.id, itemId));
  }

  void audit.categoryUpdated(admin.id, { action: "master_updated", kind, itemId, name });

  revalidatePath("/super-admin/masters");
  return { error: null };
}

export async function deleteMasterItem(kind: string, itemId: number): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const table = masterTable(kind);
  if (!table) return { error: "Invalid master type." };
  if (!Number.isInteger(itemId)) return { error: "Invalid ID." };

  const [existing] = await db.select({ id: table.id }).from(table).where(eq(table.id, itemId));
  if (!existing) return { error: "Record not found." };

  await db.delete(table).where(eq(table.id, itemId));

  void audit.categoryDeleted(admin.id, { action: "master_deleted", kind, itemId });

  revalidatePath("/super-admin/masters");
  return { error: null };
}

export async function importMasterItems(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const kind = String(formData.get("kind") ?? "");
  const table = masterTable(kind);
  if (!table) return { error: "Invalid master type." };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "Choose a file to import." };
  if (file.size > 5 * 1024 * 1024) return { error: "File must be under 5 MB." };
  const fileName = file.name.toLowerCase();
  const bytes = Buffer.from(await file.arrayBuffer());

  // Magic-byte check — a renamed .txt/… must never reach the parsers.
  const isZip = bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07);
  if (fileName.endsWith(".xlsx") && !isZip) return { error: "That file is not a real .xlsx spreadsheet." };
  if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".csv")) {
    return { error: "Only .xlsx or .csv files are supported." };
  }

  const rows: { name: string; strength?: string; form?: string; unit?: string }[] = [];
  try {
    if (fileName.endsWith(".xlsx")) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(bytes as never);
      const sheet = workbook.worksheets[0];
      if (!sheet) return { error: "The file has no worksheet." };
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // header
        const cells = (row.values as (string | number | undefined)[]).slice(1);
        const name = String(cells[0] ?? "").trim();
        if (!name) return;
        rows.push({
          name,
          strength: String(cells[1] ?? "").trim() || undefined,
          form: String(cells[2] ?? "").trim() || undefined,
          unit: String(cells[3] ?? "").trim() || undefined,
        });
      });
    } else if (fileName.endsWith(".csv")) {
      const text = bytes.toString("utf8").replace(/^\uFEFF/, "");
      for (const line of text.split(/\r?\n/)) {
        const cells = line.split(",").map((c) => c.trim().replace(/^"(.*)"$/, "$1"));
        if (!cells[0] || cells[0].toLowerCase() === "name") continue;
        rows.push({
          name: cells[0],
          strength: cells[1] || undefined,
          form: cells[2] || undefined,
          unit: cells[3] || undefined,
        });
      }
    } else {
      return { error: "Only .xlsx or .csv files are supported." };
    }
  } catch {
    return { error: "Could not read the file. Make sure it is a valid spreadsheet." };
  }

  if (rows.length === 0) return { error: "No rows found in the file." };
  if (rows.length > 1000) return { error: "At most 1000 rows can be imported at once." };

  let inserted = 0;
  let skipped = 0;
  for (const r of rows) {
    if (r.name.length > 255) {
      skipped++;
      continue;
    }
    const [dup] = await db.select({ id: table.id }).from(table).where(eq(table.name, r.name));
    if (dup) {
      skipped++;
      continue;
    }
    if (kind === "medicines") {
      await db
        .insert(medicines)
        .values({
          name: r.name,
          strength: r.strength ?? null,
          form: r.form || "Tablet",
          unit: r.unit || "mg",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
    } else {
      await db.insert(table).values({ name: r.name, createdAt: new Date(), updatedAt: new Date() });
    }
    inserted++;
  }

  void audit.categoryCreated(admin.id, {
    action: "master_imported",
    kind,
    inserted,
    skipped,
    fileName,
  });

  revalidatePath("/super-admin/masters");
  return { error: inserted > 0 ? null : `No new rows imported (${skipped} duplicates/skips).` };
}

// ── Categories (legacy `CategoryController` parity) ─────────────────────────

export async function storeCategory(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Category name is required." };
  if (name.length > 255) return { error: "Category name must be at most 255 characters." };

  const slug = slugify(name) || "category";
  const [dup] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug));
  if (dup) return { error: "A category with this name already exists." };

  const [created] = await db
    .insert(categories)
    .values({ name, slug, createdAt: new Date(), updatedAt: new Date() })
    .$returningId();

  void audit.categoryCreated(admin.id, { action: "category_created", categoryId: Number(created.id), name });

  revalidatePath("/super-admin/blogs");
  return { error: null };
}

export async function updateCategory(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const categoryId = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!Number.isInteger(categoryId)) return { error: "Invalid category ID." };
  if (!name) return { error: "Category name is required." };

  const [existing] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, categoryId));
  if (!existing) return { error: "Category not found." };

  const slug = slugify(name) || "category";
  const [dup] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.slug, slug), ne(categories.id, categoryId)));
  if (dup) return { error: "A category with this name already exists." };

  await db.update(categories).set({ name, slug, updatedAt: new Date() }).where(eq(categories.id, categoryId));

  void audit.categoryUpdated(admin.id, { action: "category_updated", categoryId, name });

  revalidatePath("/super-admin/blogs");
  return { error: null };
}

export async function deleteCategory(categoryId: number): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!Number.isInteger(categoryId)) return { error: "Invalid category ID." };

  const [existing] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, categoryId));
  if (!existing) return { error: "Category not found." };

  const [used] = await db
    .select({ id: blogs.id })
    .from(blogs)
    .where(eq(blogs.categoryId, categoryId))
    .limit(1);
  if (used) return { error: "Cannot delete a category that has blogs. Move or delete its blogs first." };

  await db.delete(categories).where(eq(categories.id, categoryId));

  void audit.categoryDeleted(admin.id, { action: "category_deleted", categoryId });

  revalidatePath("/super-admin/blogs");
  return { error: null };
}

// ── Blogs (legacy `BlogController` parity) ──────────────────────────────────

async function uniqueSlug(base: string, ignoreId?: number): Promise<string> {
  const candidate = slugify(base) || "blog";
  let slug = candidate;
  let n = 2;
  for (;;) {
    const [dup] = await db
      .select({ id: blogs.id })
      .from(blogs)
      .where(and(eq(blogs.slug, slug), ignoreId ? ne(blogs.id, ignoreId) : undefined));
    if (!dup) return slug;
    slug = `${candidate}-${n++}`;
  }
}

export async function storeBlog(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const categoryIdRaw = Number(formData.get("category_id"));
  const shortcontent = String(formData.get("shortcontent") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const status = formData.get("status") === "1" || formData.get("status") === "on";
  const publishAtRaw = String(formData.get("publish_at") ?? "").trim();

  if (!title) return { error: "Title is required." };
  if (title.length > 255) return { error: "Title must be at most 255 characters." };
  if (!shortcontent) return { error: "A short summary is required." };
  if (!content) return { error: "Content is required." };

  let publishAt: Date | null = null;
  if (publishAtRaw) {
    const parsed = new Date(publishAtRaw);
    if (Number.isNaN(parsed.getTime())) return { error: "Invalid publish date." };
    publishAt = parsed;
  }

  let categoryId: number | null = null;
  if (Number.isInteger(categoryIdRaw) && categoryIdRaw > 0) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, categoryIdRaw));
    if (!cat) return { error: "Select a valid category." };
    categoryId = categoryIdRaw;
  } else {
    return { error: "A category is required." };
  }

  let imagePath: string | null = null;
  const image = formData.get("image") as File | null;
  if (image && image.size > 0) {
    try {
      imagePath = await saveImage(image, "blogs");
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Could not save the image." };
    }
  }

  const slug = await uniqueSlug(title);
  const [created] = await db
    .insert(blogs)
    .values({
      categoryId,
      title,
      slug,
      shortcontent,
      content,
      image: imagePath,
      status,
      publishAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .$returningId();

  void audit.categoryCreated(admin.id, { action: "blog_created", blogId: Number(created.id), title });

  revalidatePath("/super-admin/blogs");
  return { error: null };
}

export async function updateBlog(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const blogId = Number(formData.get("id"));
  if (!Number.isInteger(blogId)) return { error: "Invalid blog ID." };
  const title = String(formData.get("title") ?? "").trim();
  const categoryIdRaw = Number(formData.get("category_id"));
  const shortcontent = String(formData.get("shortcontent") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const status = formData.get("status") === "1" || formData.get("status") === "on";
  const publishAtRaw = String(formData.get("publish_at") ?? "").trim();

  if (!title) return { error: "Title is required." };
  if (!shortcontent) return { error: "A short summary is required." };
  if (!content) return { error: "Content is required." };

  let publishAt: Date | null = null;
  if (publishAtRaw) {
    const parsed = new Date(publishAtRaw);
    if (Number.isNaN(parsed.getTime())) return { error: "Invalid publish date." };
    publishAt = parsed;
  }

  const [existing] = await db
    .select({ id: blogs.id, image: blogs.image, title: blogs.title })
    .from(blogs)
    .where(eq(blogs.id, blogId));
  if (!existing) return { error: "Blog not found." };

  let categoryId: number | null = null;
  if (Number.isInteger(categoryIdRaw) && categoryIdRaw > 0) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, categoryIdRaw));
    if (!cat) return { error: "Select a valid category." };
    categoryId = categoryIdRaw;
  } else {
    return { error: "A category is required." };
  }

  let imagePath = existing.image;
  const image = formData.get("image") as File | null;
  if (image && image.size > 0) {
    try {
      imagePath = await saveImage(image, "blogs");
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Could not save the image." };
    }
  }

  const slug = existing.title !== title ? await uniqueSlug(title, blogId) : undefined;
  await db
    .update(blogs)
    .set({
      categoryId,
      title,
      slug,
      shortcontent,
      content,
      image: imagePath,
      status,
      publishAt,
      updatedAt: new Date(),
    })
    .where(eq(blogs.id, blogId));

  if (imagePath !== existing.image) await deleteUpload(existing.image);

  void audit.categoryUpdated(admin.id, { action: "blog_updated", blogId, title });

  revalidatePath("/super-admin/blogs");
  return { error: null };
}

export async function deleteBlog(blogId: number): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!Number.isInteger(blogId)) return { error: "Invalid blog ID." };

  const [existing] = await db
    .select({ id: blogs.id, image: blogs.image })
    .from(blogs)
    .where(eq(blogs.id, blogId));
  if (!existing) return { error: "Blog not found." };

  const images = await db.select({ image: blogImages.image }).from(blogImages).where(eq(blogImages.blogId, blogId));
  // Child rows + blog in one transaction — a crash between deletes would
  // leave orphaned blog_images pointing at a missing blog.
  await db.transaction(async (tx) => {
    await tx.delete(blogImages).where(eq(blogImages.blogId, blogId));
    await tx.delete(blogs).where(eq(blogs.id, blogId));
  });
  await deleteUpload(existing.image);
  for (const img of images) await deleteUpload(img.image);

  void audit.categoryDeleted(admin.id, { action: "blog_deleted", blogId });

  revalidatePath("/super-admin/blogs");
  return { error: null };
}

// ── Support (close ticket) ──────────────────────────────────────────────────

export async function closeTicket(ticketId: number): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!Number.isInteger(ticketId)) return { error: "Invalid ticket ID." };

  const [ticket] = await db
    .select({ id: supportTickets.id, status: supportTickets.status })
    .from(supportTickets)
    .where(eq(supportTickets.id, ticketId));
  if (!ticket) return { error: "Ticket not found." };
  if (ticket.status === "closed") return { error: "Ticket is already closed." };

  await db
    .update(supportTickets)
    .set({ status: "closed", updatedAt: new Date() })
    .where(eq(supportTickets.id, ticketId));

  void audit.supportTicketCreated(admin.id, { action: "ticket_closed", ticketId });

  revalidatePath("/super-admin/support");
  return { error: null };
}

const TICKET_PRIORITIES = ["low", "normal", "high", "urgent"];

/** Set a support ticket's priority (low / normal / high / urgent). */
export async function setTicketPriority(
  ticketId: number,
  priority: string
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!Number.isInteger(ticketId)) return { error: "Invalid ticket ID." };
  if (!TICKET_PRIORITIES.includes(priority)) return { error: "Invalid priority." };

  const [ticket] = await db
    .select({ id: supportTickets.id })
    .from(supportTickets)
    .where(eq(supportTickets.id, ticketId));
  if (!ticket) return { error: "Ticket not found." };

  await db
    .update(supportTickets)
    .set({ priority, updatedAt: new Date() })
    .where(eq(supportTickets.id, ticketId));

  void audit.supportTicketCreated(admin.id, { action: "ticket_priority_changed", ticketId, priority });

  revalidatePath("/super-admin/support");
  return { error: null };
}

// ── Support videos (legacy `SupportController` videos) ──────────────────────

export async function storeSupportVideo(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const videoType = String(formData.get("video_type") ?? "youtube");
  const videoUrl = String(formData.get("video_url") ?? "").trim();

  if (!title) return { error: "Title is required." };
  if (title.length > 255) return { error: "Title must be at most 255 characters." };
  if (!["upload", "youtube"].includes(videoType)) return { error: "Invalid video type." };

  let videoPath: string | null = null;
  if (videoType === "upload") {
    const file = formData.get("video_file") as File | null;
    if (!file || file.size === 0) return { error: "Choose a video file to upload." };
    try {
      videoPath = await saveVideo(file);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Could not save the video." };
    }
  } else {
    if (!videoUrl) return { error: "Video URL is required for YouTube videos." };
    if (videoUrl.length > 255) return { error: "Video URL must be at most 255 characters." };
  }

  const [created] = await db
    .insert(supportVideos)
    .values({
      title,
      description: description || null,
      videoType: videoType as never,
      videoUrl: videoType === "youtube" ? videoUrl : null,
      videoPath,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .$returningId();

  void audit.fileUploaded(admin.id, { action: "support_video_created", videoId: Number(created.id), title });

  revalidatePath("/super-admin/support");
  return { error: null };
}

export async function deleteSupportVideo(videoId: number): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!Number.isInteger(videoId)) return { error: "Invalid video ID." };

  const [existing] = await db
    .select({ id: supportVideos.id, videoPath: supportVideos.videoPath })
    .from(supportVideos)
    .where(eq(supportVideos.id, videoId));
  if (!existing) return { error: "Video not found." };

  await db.delete(supportVideos).where(eq(supportVideos.id, videoId));
  await deleteUpload(existing.videoPath);

  void audit.fileUploaded(admin.id, { action: "support_video_deleted", videoId });

  revalidatePath("/super-admin/support");
  return { error: null };
}

// ── Landing CMS (legacy `LandingPageController` parity) ─────────────────────

export async function updateLandingSection(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const sectionKey = String(formData.get("section_key") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const isActive = formData.get("is_active") === "1" || formData.get("is_active") === "on";
  const metadataRaw = String(formData.get("metadata") ?? "").trim();

  const [section] = await db
    .select()
    .from(landingSections)
    .where(eq(landingSections.key, sectionKey));
  if (!section) return { error: "Section not found." };

  let metadata = section.metadata as Record<string, unknown> | null;
  if (metadataRaw) {
    try {
      const parsed = JSON.parse(metadataRaw);
      if (parsed && typeof parsed === "object") {
        metadata = { ...(metadata ?? {}), ...parsed };
      }
    } catch {
      return { error: "Metadata must be valid JSON." };
    }
  }

  await db
    .update(landingSections)
    .set({
      title: title || null,
      subtitle: subtitle || null,
      isActive,
      metadata,
      updatedAt: new Date(),
    })
    .where(eq(landingSections.key, sectionKey));

  void audit.settingsUpdated(admin.id, { action: "landing_section_updated", sectionKey });

  revalidatePath("/super-admin/landing");
  return { error: null };
}

export async function storeLandingItem(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const sectionKey = String(formData.get("section_key") ?? "");
  const [section] = await db
    .select({ key: landingSections.key })
    .from(landingSections)
    .where(eq(landingSections.key, sectionKey));
  if (!section) return { error: "Section not found." };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const badge = String(formData.get("badge") ?? "").trim();
  const link = String(formData.get("link") ?? "").trim();
  const linkText = String(formData.get("link_text") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  const featuresRaw = String(formData.get("features") ?? "").trim();
  const priceMonthly = String(formData.get("price_monthly") ?? "").trim();
  const priceYearly = String(formData.get("price_yearly") ?? "").trim();
  const priceOriginalMonthly = String(formData.get("price_original_monthly") ?? "").trim();
  const priceOriginalYearly = String(formData.get("price_original_yearly") ?? "").trim();
  const stars = String(formData.get("stars") ?? "").trim();
  const isActive = formData.get("is_active") === "1" || formData.get("is_active") === "on";

  if (!title) return { error: "Title is required." };
  if (title.length > 255) return { error: "Title must be at most 255 characters." };

  const features = featuresRaw
    ? featuresRaw
        .split(/\n|,/)
        .map((s) => s.trim())
        .filter(Boolean)
    : null;

  let imagePath: string | null = null;
  const image = formData.get("image") as File | null;
  if (image && image.size > 0) {
    try {
      imagePath = await saveImage(image, "landing");
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Could not save the image." };
    }
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(landingItems)
    .where(eq(landingItems.sectionKey, sectionKey));

  const [created] = await db
    .insert(landingItems)
    .values({
      sectionKey,
      title,
      description: description || null,
      badge: badge || null,
      link: link || null,
      linkText: linkText || null,
      icon: icon || null,
      image: imagePath,
      priceMonthly: priceMonthly ? Number(priceMonthly).toFixed(2) : null,
      priceYearly: priceYearly ? Number(priceYearly).toFixed(2) : null,
      priceOriginalMonthly: priceOriginalMonthly ? Number(priceOriginalMonthly).toFixed(2) : null,
      priceOriginalYearly: priceOriginalYearly ? Number(priceOriginalYearly).toFixed(2) : null,
      features,
      stars: stars ? Number(stars) : null,
      order: Number(count),
      isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .$returningId();

  void audit.categoryCreated(admin.id, {
    action: "landing_item_created",
    sectionKey,
    itemId: Number(created.id),
    title,
  });

  revalidatePath("/super-admin/landing");
  return { error: null };
}

export async function updateLandingItem(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const itemId = Number(formData.get("id"));
  if (!Number.isInteger(itemId)) return { error: "Invalid item ID." };

  const [existing] = await db.select().from(landingItems).where(eq(landingItems.id, itemId));
  if (!existing) return { error: "Item not found." };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const badge = String(formData.get("badge") ?? "").trim();
  const link = String(formData.get("link") ?? "").trim();
  const linkText = String(formData.get("link_text") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  const featuresRaw = String(formData.get("features") ?? "").trim();
  const priceMonthly = String(formData.get("price_monthly") ?? "").trim();
  const priceYearly = String(formData.get("price_yearly") ?? "").trim();
  const priceOriginalMonthly = String(formData.get("price_original_monthly") ?? "").trim();
  const priceOriginalYearly = String(formData.get("price_original_yearly") ?? "").trim();
  const stars = String(formData.get("stars") ?? "").trim();
  const isActive = formData.get("is_active") === "1" || formData.get("is_active") === "on";

  if (!title) return { error: "Title is required." };

  const features = featuresRaw
    ? featuresRaw
        .split(/\n|,/)
        .map((s) => s.trim())
        .filter(Boolean)
    : null;

  let imagePath = existing.image;
  const image = formData.get("image") as File | null;
  if (image && image.size > 0) {
    try {
      imagePath = await saveImage(image, "landing");
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Could not save the image." };
    }
  }

  await db
    .update(landingItems)
    .set({
      title,
      description: description || null,
      badge: badge || null,
      link: link || null,
      linkText: linkText || null,
      icon: icon || null,
      image: imagePath,
      priceMonthly: priceMonthly ? Number(priceMonthly).toFixed(2) : null,
      priceYearly: priceYearly ? Number(priceYearly).toFixed(2) : null,
      priceOriginalMonthly: priceOriginalMonthly ? Number(priceOriginalMonthly).toFixed(2) : null,
      priceOriginalYearly: priceOriginalYearly ? Number(priceOriginalYearly).toFixed(2) : null,
      features,
      stars: stars ? Number(stars) : null,
      isActive,
      updatedAt: new Date(),
    })
    .where(eq(landingItems.id, itemId));

  if (imagePath !== existing.image) await deleteUpload(existing.image);

  void audit.categoryUpdated(admin.id, { action: "landing_item_updated", itemId, title });

  revalidatePath("/super-admin/landing");
  return { error: null };
}

export async function deleteLandingItem(itemId: number): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!Number.isInteger(itemId)) return { error: "Invalid item ID." };

  const [existing] = await db
    .select({ id: landingItems.id, image: landingItems.image })
    .from(landingItems)
    .where(eq(landingItems.id, itemId));
  if (!existing) return { error: "Item not found." };

  await db.delete(landingItems).where(eq(landingItems.id, itemId));
  await deleteUpload(existing.image);

  void audit.categoryDeleted(admin.id, { action: "landing_item_deleted", itemId });

  revalidatePath("/super-admin/landing");
  return { error: null };
}

/** Move a landing item up/down within its section (swaps the order field). */
export async function reorderLandingItem(
  itemId: number,
  direction: "up" | "down"
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!Number.isInteger(itemId)) return { error: "Invalid item ID." };
  if (direction !== "up" && direction !== "down") return { error: "Invalid direction." };

  const [item] = await db
    .select({ id: landingItems.id, sectionKey: landingItems.sectionKey, order: landingItems.order })
    .from(landingItems)
    .where(eq(landingItems.id, itemId));
  if (!item) return { error: "Item not found." };

  const siblings = await db
    .select({ id: landingItems.id, order: landingItems.order })
    .from(landingItems)
    .where(eq(landingItems.sectionKey, item.sectionKey))
    .orderBy(asc(landingItems.order), asc(landingItems.id));

  const idx = siblings.findIndex((s) => s.id === itemId);
  const target = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || target < 0 || target >= siblings.length) return { error: null }; // at edge

  // Both order swaps in one transaction — a crash between updates would
  // leave two items sharing the same order value.
  const other = siblings[target];
  await db.transaction(async (tx) => {
    await tx
      .update(landingItems)
      .set({ order: other.order ?? 0, updatedAt: new Date() })
      .where(eq(landingItems.id, itemId));
    await tx
      .update(landingItems)
      .set({ order: item.order ?? 0, updatedAt: new Date() })
      .where(eq(landingItems.id, other.id));
  });

  void audit.categoryUpdated(admin.id, { action: "landing_item_reordered", itemId, direction });

  revalidatePath("/super-admin/landing");
  return { error: null };
}

// ── Settings (mail + company) ───────────────────────────────────────────────

export async function saveMailSettings(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const host = String(formData.get("host") ?? "").trim();
  const portRaw = String(formData.get("port") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const encryption = String(formData.get("encryption") ?? "").trim();
  const fromAddress = String(formData.get("from_address") ?? "").trim();
  const fromName = String(formData.get("from_name") ?? "").trim();

  if (!host) return { error: "SMTP host is required." };
  const port = Number(portRaw);
  if (!portRaw || !Number.isInteger(port) || port < 1 || port > 65535) {
    return { error: "Port must be a valid number between 1 and 65535." };
  }
  if (fromAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromAddress)) {
    return { error: "From address must be a valid email." };
  }

  const [existing] = await db.select().from(mailSettings).limit(1);
  const values = {
    mailer: "smtp",
    host,
    port,
    username: username || null,
    password: password ? encryptSecret(password) : existing?.password ?? null,
    encryption: encryption || null,
    fromAddress: fromAddress || null,
    fromName: fromName || null,
    updatedAt: new Date(),
  };

  if (existing) {
    await db.update(mailSettings).set(values).where(eq(mailSettings.id, existing.id));
  } else {
    await db.insert(mailSettings).values({ ...values, createdAt: new Date() });
  }

  void audit.settingsUpdated(admin.id, { action: "mail_settings_saved" });

  revalidatePath("/super-admin/email-setup");
  return { error: null };
}

/** Send a test email using the saved SMTP config to verify it works. */
export async function testMailSettings(): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const [mail] = await db.select().from(mailSettings).limit(1);
  if (!mail?.host) return { error: "Save SMTP settings first, then send a test email." };

  const to = admin.email;
  if (!to) return { error: "Your account has no email address to send the test to." };

  try {
    await sendMail({
      to,
      subject: "SkoraCares — SMTP test successful",
      text: `Hi ${admin.name},\n\nThis is a test email from the SkoraCares platform. Your SMTP configuration is working correctly.\n\n— SkoraCares`,
    });
  } catch (err) {
    console.error("SMTP test failed:", err);
    return { error: `SMTP test failed: ${err instanceof Error ? err.message : "unknown error"}` };
  }

  void audit.settingsUpdated(admin.id, { action: "mail_settings_test" });
  return { error: null };
}

export async function saveCompanySettings(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const text = (key: string) => String(formData.get(key) ?? "").trim();
  const trialDays = Number(text("default_trial_days"));
  if (!text("default_trial_days") || !Number.isInteger(trialDays) || trialDays < 1 || trialDays > 365) {
    return { error: "Trial days must be a whole number between 1 and 365." };
  }

  const [existing] = await db.select().from(companySettings).limit(1);

  const uploads: Record<"light_logo" | "dark_logo" | "favicon", string | null> = {
    light_logo: existing?.lightLogo ?? null,
    dark_logo: existing?.darkLogo ?? null,
    favicon: existing?.favicon ?? null,
  };
  const subdirs: Record<keyof typeof uploads, string> = {
    light_logo: "company",
    dark_logo: "company",
    favicon: "company",
  };
  for (const key of ["light_logo", "dark_logo", "favicon"] as const) {
    const file = formData.get(key) as File | null;
    if (file && file.size > 0) {
      try {
        uploads[key] = await saveImage(file, subdirs[key], 1 * 1024 * 1024);
      } catch (err) {
        return { error: err instanceof Error ? err.message : `Could not save the ${key} file.` };
      }
    }
  }

  const values = {
    companyName: text("company_name") || null,
    companyShortName: text("company_short_name") || null,
    companyTagline: text("company_tagline") || null,
    companyDescription: text("company_description") || null,
    lightLogo: uploads.light_logo,
    darkLogo: uploads.dark_logo,
    favicon: uploads.favicon,
    companyEmail1: text("company_email1") || null,
    companyEmail2: text("company_email2") || null,
    companyMobile1: text("company_mobile1") || null,
    companyMobile2: text("company_mobile2") || null,
    companyWhatsapp1: text("company_whatsapp1") || null,
    companyWhatsapp2: text("company_whatsapp2") || null,
    facebook: text("facebook") || null,
    twitter: text("twitter") || null,
    linkedin: text("linkedin") || null,
    instagram: text("instagram") || null,
    pintrest: text("pintrest") || null,
    map: text("map") || null,
    companyAddress1: text("company_address1") || null,
    companyAddress2: text("company_address2") || null,
    currencyName: text("currency_name") || null,
    currencySymbol: text("currency_symbol") || null,
    defaultTrialDays: trialDays,
    updatedAt: new Date(),
  };

  if (existing) {
    await db.update(companySettings).set(values).where(eq(companySettings.id, existing.id));
    if (uploads.light_logo !== existing.lightLogo) await deleteUpload(existing.lightLogo);
    if (uploads.dark_logo !== existing.darkLogo) await deleteUpload(existing.darkLogo);
    if (uploads.favicon !== existing.favicon) await deleteUpload(existing.favicon);
  } else {
    await db.insert(companySettings).values({ ...values, createdAt: new Date() });
  }

  void audit.settingsUpdated(admin.id, { action: "company_settings_saved" });

  revalidatePath("/super-admin/settings");
  return { error: null };
}