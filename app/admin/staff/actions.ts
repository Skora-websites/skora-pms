"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clinicDoctors,
  doctorClinics,
  receptionistClinics,
  users,
} from "@/lib/db/schema";
import { requireAdminPermission } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { audit } from "@/lib/security/audit-log";
import { hashPassword } from "@/lib/auth/password";
import { revokeAllSessionsForUser } from "@/lib/auth/session";

export type StaffActionResult = { error: string | null };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Receptionist accounts (parity with app/doctor/staff) ─────────────────────

/**
 * Create a receptionist account for one of the business's clinics. The
 * account anchors to the clinic's owning doctor (users.reference_role_id /
 * doctor_id = the clinic owner — the same spatie-team semantics the doctor
 * dashboard's staff module uses), so the new staff member lands inside the
 * right practice with the role's default permissions.
 */
export async function createStaffMember(
  _prev: StaffActionResult,
  formData: FormData
): Promise<StaffActionResult> {
  const guard = await requireAdminPermission("roles-permissions", { ownerOnly: true });
  if (!guard) return { error: "Only the business owner can add staff." };

  const clinicId = Number(formData.get("clinic_id"));
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const password = String(formData.get("password") ?? "");

  if (!clinicId || !Number.isInteger(clinicId)) return { error: "Select a clinic." };
  if (!name) return { error: "Staff name is required." };
  if (name.length > 255) return { error: "Staff name must be at most 255 characters." };
  if (!email) return { error: "Email is required." };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const scope = await getBusinessScope();
  if (!scope.clinicIds.includes(clinicId)) {
    return { error: "That clinic is not part of your business." };
  }

  // The anchoring owner doctor of the chosen clinic.
  const [clinic] = await db
    .select({ id: doctorClinics.id, doctorId: doctorClinics.doctorId })
    .from(doctorClinics)
    .where(eq(doctorClinics.id, clinicId))
    .limit(1);
  if (!clinic) return { error: "Clinic not found." };

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) return { error: "A user with this email already exists." };

  const [created] = await db
    .insert(users)
    .values({
      referenceRoleId: clinic.doctorId,
      doctorId: clinic.doctorId,
      name,
      email,
      phone,
      password: await hashPassword(password),
      role: "receptionist",
      status: "active",
      emailVerifiedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .$returningId();
  const staffId = Number(created.id);

  audit.settingsUpdated(guard.user.id, {
    action: "staff_created",
    staffId,
    clinicId,
    anchorDoctorId: clinic.doctorId,
  });

  revalidatePath("/admin/staff");
  return { error: null };
}

/**
 * Edit a receptionist account (name/email/phone + optional password reset).
 * Target must be a receptionist anchored to one of the business's clinics
 * (referenceRoleId ∈ scope.doctorIds) — never a doctor, patient, or another
 * tier's staff.
 */
export async function updateStaffMember(
  _prev: StaffActionResult,
  formData: FormData
): Promise<StaffActionResult> {
  const guard = await requireAdminPermission("roles-permissions", { ownerOnly: true });
  if (!guard) return { error: "Only the business owner can edit staff." };

  const staffId = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const password = String(formData.get("password") ?? "");

  if (!staffId || !Number.isInteger(staffId)) return { error: "Invalid staff ID." };
  if (!name) return { error: "Staff name is required." };
  if (name.length > 255) return { error: "Staff name must be at most 255 characters." };
  if (!email) return { error: "Email is required." };
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email." };
  if (password && password.length < 8) return { error: "Password must be at least 8 characters." };

  const scope = await getBusinessScope();
  const [existing] = await db
    .select({ id: users.id, role: users.role, referenceRoleId: users.referenceRoleId })
    .from(users)
    .where(and(eq(users.id, staffId), eq(users.role, "receptionist")))
    .limit(1);
  if (
    !existing ||
    !existing.referenceRoleId ||
    !scope.doctorIds.includes(existing.referenceRoleId)
  ) {
    return { error: "Staff member not found in your business." };
  }

  const [dup] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), ne(users.id, staffId)))
    .limit(1);
  if (dup) return { error: "A user with this email already exists." };

  const updates: Record<string, unknown> = {
    name,
    email,
    phone,
    updatedAt: new Date(),
  };
  if (password) updates.password = await hashPassword(password);

  await db.update(users).set(updates).where(eq(users.id, staffId));

  // Credential reset → kill the staff member's active sessions (parity with
  // the doctor staff module).
  if (password) {
    await revokeAllSessionsForUser(staffId);
    void audit.settingsUpdated(guard.user.id, { action: "staff_password_reset", staffId });
  }

  audit.settingsUpdated(guard.user.id, { action: "staff_updated", staffId });
  revalidatePath("/admin/staff");
  return { error: null };
}

/**
 * Delete a receptionist account. Hard delete mirrors /doctor/staff (the
 * account is a pure staff login with no clinical records of its own);
 * sessions are revoked first so a deleted account can't ride an open JWT.
 */
export async function deleteStaffMember(
  _prev: StaffActionResult,
  formData: FormData
): Promise<StaffActionResult> {
  const guard = await requireAdminPermission("roles-permissions", { ownerOnly: true });
  if (!guard) return { error: "Only the business owner can remove staff." };

  const staffId = Number(formData.get("id"));
  if (!staffId || !Number.isInteger(staffId)) return { error: "Invalid staff ID." };

  const scope = await getBusinessScope();
  const [existing] = await db
    .select({ id: users.id, referenceRoleId: users.referenceRoleId })
    .from(users)
    .where(and(eq(users.id, staffId), eq(users.role, "receptionist")))
    .limit(1);
  if (
    !existing ||
    !existing.referenceRoleId ||
    !scope.doctorIds.includes(existing.referenceRoleId)
  ) {
    return { error: "Staff member not found in your business." };
  }

  await revokeAllSessionsForUser(staffId);
  await db.delete(users).where(eq(users.id, staffId));

  audit.settingsUpdated(guard.user.id, { action: "staff_deleted", staffId });
  revalidatePath("/admin/staff");
  return { error: null };
}

// ── Receptionist clinic assignment (role model G4) ───────────────────────

/**
 * Replace which clinics a receptionist operates. The receptionist must be
 * anchored to a doctor inside the owner's business; every chosen clinic must
 * be one of the business's clinics. Transactional replace — a crash can't
 * leave the receptionist with a half-updated assignment set.
 */
export async function assignReceptionistClinics(
  _prev: StaffActionResult,
  formData: FormData
): Promise<StaffActionResult> {
  const guard = await requireAdminPermission("roles-permissions", { ownerOnly: true });
  if (!guard) return { error: "Only the business owner can assign clinics." };

  const staffId = Number(formData.get("id"));
  if (!staffId || !Number.isInteger(staffId)) return { error: "Invalid staff ID." };

  const scope = await getBusinessScope();
  const [existing] = await db
    .select({ id: users.id, referenceRoleId: users.referenceRoleId })
    .from(users)
    .where(and(eq(users.id, staffId), eq(users.role, "receptionist")))
    .limit(1);
  if (
    !existing ||
    !existing.referenceRoleId ||
    !scope.doctorIds.includes(existing.referenceRoleId)
  ) {
    return { error: "Staff member not found in your business." };
  }

  const clinicIds = formData
    .getAll("clinic_id")
    .map((v) => Number(v))
    .filter((id) => Number.isInteger(id) && id > 0);
  if (clinicIds.some((id) => !scope.clinicIds.includes(id))) {
    return { error: "One of the selected clinics is not part of your business." };
  }

  await db.transaction(async (tx) => {
    await tx.delete(receptionistClinics).where(eq(receptionistClinics.receptionistId, staffId));
    if (clinicIds.length > 0) {
      await tx.insert(receptionistClinics).values(
        clinicIds.map((clinicId) => ({
          receptionistId: staffId,
          clinicId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      );
    }
  });

  audit.settingsUpdated(guard.user.id, {
    action: "receptionist_clinics_assigned",
    staffId,
    clinicIds,
  });

  revalidatePath("/admin/staff");
  return { error: null };
}

/** Current clinic assignments for a receptionist (owner-view helper). */
export async function getReceptionistAssignments(): Promise<Map<number, number[]>> {
  const guard = await requireAdminPermission("roles-permissions", { ownerOnly: true });
  if (!guard) return new Map();
  const scope = await getBusinessScope();
  const anchorIds = scope.doctorIds.length ? scope.doctorIds : [-1];
  const rows = await db
    .select({
      receptionistId: receptionistClinics.receptionistId,
      clinicId: receptionistClinics.clinicId,
      clinicName: doctorClinics.clinicName,
    })
    .from(receptionistClinics)
    .innerJoin(doctorClinics, eq(doctorClinics.id, receptionistClinics.clinicId))
    .where(
      inArray(
        receptionistClinics.receptionistId,
        db
          .select({ id: users.id })
          .from(users)
          .where(and(eq(users.role, "receptionist"), inArray(users.referenceRoleId, anchorIds)))
      )
    );
  const map = new Map<number, number[]>();
  for (const row of rows) {
    const list = map.get(row.receptionistId) ?? [];
    list.push(row.clinicId);
    map.set(row.receptionistId, list);
  }
  return map;
}

// ── Doctor memberships (add/remove doctors at business clinics) ─────────────

/**
 * Add a doctor to one of the business's clinics. If the email already
 * belongs to an active doctor, they are linked as-is (regardless of which
 * practice they currently belong to — the business owner spans practices);
 * otherwise a new doctor account is created, anchored to the clinic's
 * owning doctor. The clinic owner always keeps a membership row, so
 * removing an owner is rejected.
 */
export async function addDoctorMembership(
  _prev: StaffActionResult,
  formData: FormData
): Promise<StaffActionResult> {
  const guard = await requireAdminPermission("roles-permissions", { ownerOnly: true });
  if (!guard) return { error: "Only the business owner can manage clinic doctors." };

  const clinicId = Number(formData.get("clinic_id"));
  const doctorName = String(formData.get("doctor_name") ?? "").trim();
  const doctorEmail = String(formData.get("doctor_email") ?? "").trim().toLowerCase();
  const doctorPhone = String(formData.get("doctor_phone") ?? "").trim() || null;
  const specialization = String(formData.get("doctor_specialization") ?? "").trim() || null;
  const qualification = String(formData.get("doctor_qualification") ?? "").trim() || null;
  const password = String(formData.get("doctor_password") ?? "");

  if (!clinicId || !Number.isInteger(clinicId)) return { error: "Select a clinic." };
  if (!doctorName) return { error: "Doctor name is required." };
  if (doctorName.length > 255) return { error: "Doctor name must be at most 255 characters." };
  if (!doctorEmail) return { error: "Doctor email is required." };
  if (!EMAIL_RE.test(doctorEmail)) return { error: "Enter a valid email." };

  const scope = await getBusinessScope();
  if (!scope.clinicIds.includes(clinicId)) {
    return { error: "That clinic is not part of your business." };
  }

  const [clinic] = await db
    .select({ id: doctorClinics.id, doctorId: doctorClinics.doctorId })
    .from(doctorClinics)
    .where(eq(doctorClinics.id, clinicId))
    .limit(1);
  if (!clinic) return { error: "Clinic not found." };

  const [existing] = await db
    .select({ id: users.id, role: users.role, status: users.status })
    .from(users)
    .where(eq(users.email, doctorEmail))
    .limit(1);

  let memberId: number;
  if (existing) {
    if (existing.role !== "doctor") return { error: "That email belongs to a non-doctor account." };
    if (existing.status !== "active") return { error: "That doctor's account is not active." };
    memberId = existing.id;
  } else {
    if (password.length < 8) return { error: "Password must be at least 8 characters." };
    const [created] = await db
      .insert(users)
      .values({
        referenceRoleId: clinic.doctorId,
        doctorId: clinic.doctorId,
        salutation: "Dr.",
        name: doctorName,
        email: doctorEmail,
        phone: doctorPhone,
        specialization,
        qualification,
        password: await hashPassword(password),
        role: "doctor",
        status: "active",
        emailVerifiedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .$returningId();
    memberId = Number(created.id);
  }

  const [membership] = await db
    .select({ id: clinicDoctors.id, isActive: clinicDoctors.isActive })
    .from(clinicDoctors)
    .where(and(eq(clinicDoctors.clinicId, clinicId), eq(clinicDoctors.doctorId, memberId)))
    .limit(1);
  if (membership) {
    if (membership.isActive) return { error: "That doctor is already at this clinic." };
    await db
      .update(clinicDoctors)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(clinicDoctors.id, membership.id));
  } else {
    await db.insert(clinicDoctors).values({
      clinicId,
      doctorId: memberId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  audit.settingsUpdated(guard.user.id, {
    action: existing ? "clinic_doctor_added" : "clinic_doctor_created",
    clinicId,
    memberDoctorId: memberId,
  });

  revalidatePath("/admin/staff");
  revalidatePath("/admin/clinics");
  return { error: null };
}

/**
 * Remove a doctor's membership at one of the business's clinics. The
 * clinic's owning doctor can never be removed (every clinic must keep an
 * owner); other members are hard-removed from clinic_doctors (the doctor
 * account itself stays — parity with the doctor module).
 */
export async function removeDoctorMembership(
  _prev: StaffActionResult,
  formData: FormData
): Promise<StaffActionResult> {
  const guard = await requireAdminPermission("roles-permissions", { ownerOnly: true });
  if (!guard) return { error: "Only the business owner can manage clinic doctors." };

  const clinicId = Number(formData.get("clinic_id"));
  const doctorId = Number(formData.get("doctor_id"));

  if (!clinicId || !Number.isInteger(clinicId)) return { error: "Invalid clinic." };
  if (!doctorId || !Number.isInteger(doctorId)) return { error: "Invalid doctor." };

  const scope = await getBusinessScope();
  if (!scope.clinicIds.includes(clinicId)) {
    return { error: "That clinic is not part of your business." };
  }

  const [clinic] = await db
    .select({ id: doctorClinics.id, doctorId: doctorClinics.doctorId })
    .from(doctorClinics)
    .where(eq(doctorClinics.id, clinicId))
    .limit(1);
  if (!clinic) return { error: "Clinic not found." };
  if (clinic.doctorId === doctorId) {
    return { error: "The clinic's owning doctor cannot be removed." };
  }

  const [membership] = await db
    .select({ id: clinicDoctors.id })
    .from(clinicDoctors)
    .where(and(eq(clinicDoctors.clinicId, clinicId), eq(clinicDoctors.doctorId, doctorId)))
    .limit(1);
  if (!membership) return { error: "That doctor is not at this clinic." };

  await db.delete(clinicDoctors).where(eq(clinicDoctors.id, membership.id));

  audit.settingsUpdated(guard.user.id, { action: "clinic_doctor_removed", clinicId, doctorId });

  revalidatePath("/admin/staff");
  revalidatePath("/admin/clinics");
  return { error: null };
}
