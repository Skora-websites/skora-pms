"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  users,
  doctorClinics,
  permissions,
  modelHasPermissions,
  modelHasRoles,
  roles,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";
import { DEFAULT_DOCTOR_MODULE_PERMS } from "@/lib/auth/server-permissions";
import { trialEndsInDays } from "@/lib/auth/trial";
import { getTrialDays } from "@/lib/queries/landing";
import { isDupKey, dupKeyConstraint } from "@/lib/db/dup";
import { hashPassword } from "@/lib/auth/password";
import { audit } from "@/lib/security/audit-log";
import { revokeAllSessionsForUser } from "@/lib/auth/session";

export type AdminActionResult = { error: string | null };

const USER_MODEL = "App\\Models\\User";

const ROLE_PREFIX: Record<string, string> = {
  doctor: "DOC",
  patient: "PAT",
  receptionist: "REC",
  admin: "ADM",
  super_admin: "SUP",
};
const VALID_ROLES = ["super_admin", "admin", "manager", "doctor", "receptionist", "patient"];
const VALID_STATUSES = ["active", "inactive"];
const SYSTEM_ROLE_BY_ROLE: Record<string, string> = {
  doctor: "Doctor",
  receptionist: "Receptionist",
  super_admin: "Super Admin",
};

/**
 * Platform user administration.
 *
 * Split out of the former app/super-admin/actions.ts god-module (1738 lines).
 * Every mutation here is super_admin-only and revokes the target's sessions
 * when identity or credentials change — the sessions table is the only
 * server-side kill switch for an already-issued JWT.
 */

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // Admin (business owner) moved to the /admin tier in Phase 3 — the
  // super-admin surface is super_admin-only now (layout + actions agree).
  if (user.role !== "super_admin") redirect("/login");
  return user;
}

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

/** User row + role + perms atomically, with registration-id collision retry. */
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
    role === "doctor" ? trialEndsInDays(await getTrialDays()) : undefined;

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
    trialEndsAt = trialEndsInDays(await getTrialDays());
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

