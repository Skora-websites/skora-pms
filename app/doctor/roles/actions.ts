"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, ne, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { roles, permissions, roleHasPermissions, modelHasRoles, modelHasPermissions, users } from "@/lib/db/schema";
import { getCurrentUser, getUserPermissions } from "@/lib/auth/user";
import { requireDoctorPermission } from "@/lib/auth/server-permissions";

import { audit } from "@/lib/security/audit-log";

export type RoleActionResult = { error: string | null };

const USER_MODEL = "App\\Models\\User";
const SYSTEM_ROLE_NAMES = ["Super Admin", "Doctor", "Receptionist", "Nurse", "Accountant"];

async function getUserRoles(userId: number): Promise<string[]> {
  const rows = await db
    .select({ name: roles.name })
    .from(roles)
    .innerJoin(modelHasRoles, eq(modelHasRoles.roleId, roles.id))
    .where(and(eq(modelHasRoles.modelId, userId), eq(modelHasRoles.modelType, USER_MODEL)));
  return rows.map((r) => r.name);
}

/**
 * Guard for the read-only permission actions below. Platform admins
 * (super-admin permissions dialog) and practice users holding the
 * roles-permissions module (route guard for /doctor/roles) may read the
 * permission catalog / staff permission sets. Everyone else gets nothing.
 * (The helper itself now lives in lib/actions/permissions.ts.)
 */
async function parsePermissionInput(raw: FormData | string[] | string): Promise<number[]> {
  const names = Array.isArray(raw)
    ? raw
    : typeof raw === "string"
      ? raw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : String(raw.get("permissions") ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
  if (names.length === 0) return [];
  const rows = await db
    .select({ id: permissions.id, name: permissions.name, parentId: permissions.parentId })
    .from(permissions)
    .where(inArray(permissions.name, names));
  const ids = new Set(rows.map((r) => r.id));
  // The role form toggles child permissions only; the nav + route guards
  // check the parent module perm (e.g. "registrations"), so include each
  // granted child's parent — otherwise UI-created roles can never see their
  // modules in the sidebar.
  for (const r of rows) if (r.parentId) ids.add(r.parentId);
  return [...ids];
}

// ── Role CRUD (legacy `RoleController` parity) ─────────────────────────────

export async function createRole(
  _prev: RoleActionResult,
  formData: FormData
): Promise<RoleActionResult> {
  const doctorId = await requireDoctorPermission("roles-create");
  if (!doctorId) return { error: "You don't have permission to create roles." };
  const name = String(formData.get("name") ?? "").trim();
  const permissionsRaw = String(formData.get("permissions") ?? "");

  if (!name) return { error: "Role name is required." };
  if (name.length > 255) return { error: "Role name must be at most 255 characters." };
  if (SYSTEM_ROLE_NAMES.map((r) => r.toLowerCase()).includes(name.toLowerCase())) {
    return { error: "This name is reserved for system roles." };
  }

  const [existing] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(and(eq(roles.name, name), eq(roles.doctorId, doctorId)));
  if (existing) return { error: "A role with this name already exists for your practice." };

  const permissionIds = await parsePermissionInput(permissionsRaw);

  // Role + permission grants in one transaction — a crash between them
  // would leave an empty role that behaves like "no access".
  const roleId = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(roles)
      .values({
        name,
        guardName: "web",
        doctorId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .$returningId();
    const newRoleId = Number(created.id);

    if (permissionIds.length > 0) {
      await tx.insert(roleHasPermissions).values(permissionIds.map((permissionId) => ({ roleId: newRoleId, permissionId })));
    }
    return newRoleId;
  });

  void audit.roleChanged(doctorId, { action: "role_created", roleId, name, permissions: permissionIds.length });

  revalidatePath("/doctor/roles");
  return { error: null };
}

export async function updateRole(
  _prev: RoleActionResult,
  formData: FormData
): Promise<RoleActionResult> {
  const doctorId = await requireDoctorPermission("roles-edit");
  if (!doctorId) return { error: "You don't have permission to edit roles." };
  const roleId = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const permissionsRaw = String(formData.get("permissions") ?? "");

  if (!roleId || !Number.isInteger(roleId)) return { error: "Invalid role ID." };
  if (!name) return { error: "Role name is required." };
  if (SYSTEM_ROLE_NAMES.map((r) => r.toLowerCase()).includes(name.toLowerCase())) {
    return { error: "This name is reserved for system roles." };
  }

  const [existing] = await db
    .select({ id: roles.id, name: roles.name })
    .from(roles)
    .where(and(eq(roles.id, roleId), eq(roles.doctorId, doctorId)));
  if (!existing) return { error: "Role not found." };

  const [dup] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(and(eq(roles.name, name), eq(roles.doctorId, doctorId), ne(roles.id, roleId)));
  if (dup) return { error: "A role with this name already exists for your practice." };

  // Security: prevent editing your own assigned role (privilege escalation).
  const me = await getCurrentUser();
  if (me) {
    const myRoles = await getUserRoles(me.id);
    if (myRoles.includes(existing.name)) return { error: "You cannot edit a role assigned to your own account." };
  }

  const permissionIds = await parsePermissionInput(permissionsRaw);

  // Name update + permission re-sync in one transaction — a crash between
  // delete and insert would strip every permission from a live role.
  await db.transaction(async (tx) => {
    await tx.update(roles).set({ name, updatedAt: new Date() }).where(eq(roles.id, roleId));
    await tx.delete(roleHasPermissions).where(eq(roleHasPermissions.roleId, roleId));
    if (permissionIds.length > 0) {
      await tx.insert(roleHasPermissions).values(permissionIds.map((permissionId) => ({ roleId, permissionId })));
    }
  });

  void audit.roleChanged(doctorId, { action: "role_updated", roleId, name, permissions: permissionIds.length });

  revalidatePath("/doctor/roles");
  return { error: null };
}

export async function deleteRole(roleId: number): Promise<RoleActionResult> {
  const doctorId = await requireDoctorPermission("roles-delete");
  if (!doctorId) return { error: "You don't have permission to delete roles." };
  if (!roleId || !Number.isInteger(roleId)) return { error: "Invalid role ID." };

  const [existing] = await db
    .select({ id: roles.id, name: roles.name })
    .from(roles)
    .where(and(eq(roles.id, roleId), eq(roles.doctorId, doctorId)));
  if (!existing) return { error: "Role not found." };
  if (SYSTEM_ROLE_NAMES.includes(existing.name)) return { error: "System roles cannot be deleted." };

  const me = await getCurrentUser();
  if (me) {
    const myRoles = await getUserRoles(me.id);
    if (myRoles.includes(existing.name)) return { error: "You cannot delete a role assigned to your own account." };
  }

  // Permission grants + assignments + role row in one transaction —
  // a crash mid-sequence would leave staff holding a dangling role id.
  await db.transaction(async (tx) => {
    await tx.delete(roleHasPermissions).where(eq(roleHasPermissions.roleId, roleId));
    await tx.delete(modelHasRoles).where(and(eq(modelHasRoles.modelType, USER_MODEL), eq(modelHasRoles.roleId, roleId)));
    await tx.delete(roles).where(eq(roles.id, roleId));
  });

  void audit.roleChanged(doctorId, { action: "role_deleted", roleId, name: existing.name });

  revalidatePath("/doctor/roles");
  return { error: null };
}

// ── Staff permission manager (legacy `StaffPermissionController` parity) ───

// getAllPermissions / getUserPermissionNames moved to lib/actions/permissions.ts
// — the super-admin doctor-permissions screen needs them too, and route groups
// must not import each other's actions.
import {
  getAllPermissions,
  getUserPermissionNames,
} from "@/lib/actions/permissions";

// Re-exported for the doctor roles page's own importers.
export { getAllPermissions, getUserPermissionNames };

export async function saveStaffPermissions(
  staffId: number,
  permissionNames: string[]
): Promise<RoleActionResult> {
  const doctorId = await requireDoctorPermission("roles-edit");
  if (!doctorId) return { error: "You don't have permission to edit staff permissions." };
  if (!staffId || !Number.isInteger(staffId)) return { error: "Invalid staff ID." };

  // Self-targeting guard (audit F-05): a receptionist holding roles-edit
  // could otherwise pass their own id — the ownership predicate below
  // matches their row — and grant themselves the entire permission catalog.
  // The role actions already refuse self-modification (updateRole/deleteRole);
  // this closes the same class here.
  const me = await getCurrentUser();
  if (me && staffId === me.id) {
    return { error: "You cannot edit your own permissions." };
  }

  // The staff member must belong to this doctor.
  const [staff] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(
      and(
        eq(users.id, staffId),
        or(eq(users.referenceRoleId, doctorId), eq(users.doctorId, doctorId)),
        eq(users.role, "receptionist")
      )
    );
  if (!staff) return { error: "Staff member not found." };

  let permissionIds = await parsePermissionInput(permissionNames);

  // Privilege-escalation bound (audit F-05): the granted set must be a
  // subset of what the GRANTOR themselves holds. Any catalog permission could
  // previously be handed to a peer — a receptionist with roles-edit could
  // mint themselves (via another account) a full super-admin set. Bounding
  // happens after parsePermissionInput so the implied parent modules are
  // checked too, and the self-targeting refusal above stays in force.
  if (me && permissionIds.length > 0) {
    const grantorPerms = await getUserPermissions(me.id);
    const held = await db
      .select({ id: permissions.id, name: permissions.name })
      .from(permissions)
      .where(inArray(permissions.id, permissionIds));
    permissionIds = held.filter((row) => grantorPerms.has(row.name)).map((row) => row.id);
  }

  // Replace permissions atomically — a crash between delete and insert would
  // leave the staff member with no direct permissions at all.
  await db.transaction(async (tx) => {
    await tx
      .delete(modelHasPermissions)
      .where(and(eq(modelHasPermissions.modelId, staffId), eq(modelHasPermissions.modelType, USER_MODEL)));
    if (permissionIds.length > 0) {
      await tx
        .insert(modelHasPermissions)
        .values(permissionIds.map((permissionId) => ({ permissionId, modelType: USER_MODEL, modelId: staffId })));
    }
  });

  void audit.roleChanged(doctorId, {
    action: "staff_permissions_saved",
    staffId,
    staffName: staff.name,
    permissions: permissionIds.length,
  });

  revalidatePath("/doctor/roles");
  return { error: null };
}