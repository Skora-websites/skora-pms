"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, roles, modelHasRoles, staffAttendances } from "@/lib/db/schema";
import { requireDoctorPermission } from "@/lib/auth/server-permissions";
import { revokeAllSessionsForUser } from "@/lib/auth/session";
import { audit } from "@/lib/security/audit-log";

export type StaffActionResult = { error: string | null };

const USER_MODEL = "App\\Models\\User";

const ATTENDANCE_STATUSES = ["present", "absent", "half_day", "leave"] as const;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// ── Staff CRUD (legacy `StaffController` parity) ───────────────────────────

async function ensureRoleOfDoctor(roleId: number, doctorId: number): Promise<boolean> {
  const [role] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(and(eq(roles.id, roleId), eq(roles.doctorId, doctorId)));
  return !!role;
}

export async function createStaff(
  _prev: StaffActionResult,
  formData: FormData
): Promise<StaffActionResult> {
  const doctorId = await requireDoctorPermission("staff-create");
  if (!doctorId) return { error: "You don't have permission to add staff." };
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const password = String(formData.get("password") ?? "");
  const roleId = Number(formData.get("role_id"));

  if (!name) return { error: "Staff name is required." };
  if (!email) return { error: "Email is required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (!roleId || !Number.isInteger(roleId)) return { error: "Select a role." };
  if (!(await ensureRoleOfDoctor(roleId, doctorId))) return { error: "Role not found for this practice." };

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing) return { error: "A user with this email already exists." };

  // User + role grant in one transaction — a crash between them would
  // otherwise leave a staff account with no role (locked out).
  const staffId = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(users)
      .values({
        referenceRoleId: doctorId,
        doctorId,
        name,
        email,
        phone,
        password: await bcrypt.hash(password, 12),
        role: "receptionist",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .$returningId();

    // Assign the practice role (spatie model_has_roles format).
    await tx.insert(modelHasRoles).values({
      roleId,
      modelType: USER_MODEL,
      modelId: Number(created.id),
    });
    return Number(created.id);
  });

  void audit.roleChanged(doctorId, { action: "staff_created", staffId, roleId });

  revalidatePath("/doctor/staff");
  return { error: null };
}

export async function updateStaff(
  _prev: StaffActionResult,
  formData: FormData
): Promise<StaffActionResult> {
  const doctorId = await requireDoctorPermission("staff-edit");
  if (!doctorId) return { error: "You don't have permission to edit staff." };
  const staffId = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const password = String(formData.get("password") ?? "");
  const roleId = Number(formData.get("role_id"));

  if (!staffId || !Number.isInteger(staffId)) return { error: "Invalid staff ID." };
  if (!name) return { error: "Staff name is required." };
  if (!email) return { error: "Email is required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email." };
  if (password && password.length < 8) return { error: "Password must be at least 8 characters." };
  if (!roleId || !Number.isInteger(roleId)) return { error: "Select a role." };

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, staffId), eq(users.referenceRoleId, doctorId), eq(users.role, "receptionist")));
  if (!existing) return { error: "Staff member not found." };

  const [dup] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), ne(users.id, staffId)));
  if (dup) return { error: "A user with this email already exists." };
  if (!(await ensureRoleOfDoctor(roleId, doctorId))) return { error: "Role not found for this practice." };

  const updates: Record<string, unknown> = {
    name,
    email,
    phone,
    updatedAt: new Date(),
  };
  if (password) updates.password = await bcrypt.hash(password, 12);

  // Profile update + role re-sync in one transaction — a crash between them
  // would leave the staff member with zero practice roles (locked out).
  await db.transaction(async (tx) => {
    await tx.update(users).set(updates).where(eq(users.id, staffId));

    // Sync practice role.
    await tx.delete(modelHasRoles).where(and(eq(modelHasRoles.modelId, staffId), eq(modelHasRoles.modelType, USER_MODEL)));
    await tx.insert(modelHasRoles).values({ roleId, modelType: USER_MODEL, modelId: staffId });
  });

  // Staff credential reset → kill the staff member's active sessions.
  if (password) {
    await revokeAllSessionsForUser(staffId);
    void audit.passwordChange(staffId);
  }

  void audit.roleChanged(doctorId, { action: "staff_updated", staffId, roleId });

  revalidatePath("/doctor/staff");
  return { error: null };
}

export async function deleteStaff(staffId: number): Promise<StaffActionResult> {
  const doctorId = await requireDoctorPermission("staff-delete");
  if (!doctorId) return { error: "You don't have permission to delete staff." };
  if (!staffId || !Number.isInteger(staffId)) return { error: "Invalid staff ID." };

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, staffId), eq(users.referenceRoleId, doctorId), eq(users.role, "receptionist")));
  if (!existing) return { error: "Staff member not found." };

  // Attendance cleanup + role unlink + user delete in one transaction —
  // a crash mid-sequence would leave orphan rows or a role-less zombie.
  await db.transaction(async (tx) => {
    await tx.delete(modelHasRoles).where(and(eq(modelHasRoles.modelId, staffId), eq(modelHasRoles.modelType, USER_MODEL)));
    // Hard-deleting the user orphans their attendance rows (no DB cascade) —
    // clean them up so attendance reports stay consistent.
    await tx.delete(staffAttendances).where(eq(staffAttendances.staffId, staffId));
    await tx.delete(users).where(eq(users.id, staffId));
  });
  // A deleted user's JWTs would otherwise stay valid until cookie expiry.
  await revokeAllSessionsForUser(staffId);

  void audit.roleChanged(doctorId, { action: "staff_deleted", staffId });

  revalidatePath("/doctor/staff");
  return { error: null };
}

// ── Attendance (legacy `getAttendanceData` / `saveAttendance` / `getAttendanceReport`) ──

export async function saveAttendance(
  _prev: StaffActionResult,
  formData: FormData
): Promise<StaffActionResult> {
  const doctorId = await requireDoctorPermission("staff-edit");
  if (!doctorId) return { error: "You don't have permission to manage attendance." };
  const date = String(formData.get("date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Invalid date." };

  const raw = String(formData.get("attendance") ?? "[]");
  let rows: {
    staff_id: number;
    status: string;
    check_in?: string;
    check_out?: string;
    notes?: string;
  }[];
  try {
    rows = JSON.parse(raw);
  } catch {
    return { error: "Invalid attendance payload." };
  }
  if (!Array.isArray(rows)) return { error: "Invalid attendance payload." };

  for (const att of rows) {
    if (!att || !Number.isInteger(att.staff_id)) continue;
    if (!(ATTENDANCE_STATUSES as readonly string[]).includes(att.status)) return { error: "Invalid status." };
    if (att.check_in && !TIME_RE.test(att.check_in)) return { error: "Invalid check-in time." };
    if (att.check_out && !TIME_RE.test(att.check_out)) return { error: "Invalid check-out time." };

    const [staff] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, att.staff_id), eq(users.referenceRoleId, doctorId)));
    if (!staff) continue;

    const isWorkDay = att.status === "present" || att.status === "half_day";
    await db
      .insert(staffAttendances)
      .values({
        staffId: att.staff_id,
        doctorId,
        date: date as never,
        status: att.status,
        checkIn: isWorkDay ? (att.check_in ?? null) : null,
        checkOut: isWorkDay ? (att.check_out ?? null) : null,
        notes: att.notes?.trim() || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onDuplicateKeyUpdate({
        set: {
          doctorId,
          status: att.status,
          checkIn: isWorkDay ? (att.check_in ?? null) : null,
          checkOut: isWorkDay ? (att.check_out ?? null) : null,
          notes: att.notes?.trim() || null,
          updatedAt: new Date(),
        },
      });
  }

  void audit.settingsUpdated(doctorId, { action: "attendance_saved", date });

  revalidatePath("/doctor/staff");
  return { error: null };
}