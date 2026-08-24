"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { roles, permissions, roleHasPermissions, modelHasRoles, modelHasPermissions, users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";
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

/** Permission names grouped by module (parent). Mirrors legacy `allPermissions`. */
export async function getAllPermissions() {
  const all = await db.select().from(permissions).orderBy(permissions.id);
  const modules = all.filter((p) => p.parentId === null);
  const children = all.filter((p) => p.parentId !== null);

  return modules.map((m) => ({
    id: m.id,
    name: m.name,
    permissions: children.filter((c) => c.parentId === m.id),
  }));
}

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
    .select({ id: permissions.id, name: permissions.name })
    .from(permissions)
    .where(inArray(permissions.name, names));
  return rows.map((r) => r.id);
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

  const [created] = await db
    .insert(roles)
    .values({
      name,
      guardName: "web",
      doctorId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .$returningId();
  const roleId = Number(created.id);

  if (permissionIds.length > 0) {
    await db.insert(roleHasPermissions).values(permissionIds.map((permissionId) => ({ roleId, permissionId })));
  }

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

  await db.update(roles).set({ name, updatedAt: new Date() }).where(eq(roles.id, roleId));
  await db.delete(roleHasPermissions).where(eq(roleHasPermissions.roleId, roleId));
  if (permissionIds.length > 0) {
    await db.insert(roleHasPermissions).values(permissionIds.map((permissionId) => ({ roleId, permissionId })));
  }

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

  await db.delete(roleHasPermissions).where(eq(roleHasPermissions.roleId, roleId));
  await db.delete(modelHasRoles).where(and(eq(modelHasRoles.roleId, roleId), eq(modelHasRoles.modelType, USER_MODEL)));
  await db.delete(roles).where(eq(roles.id, roleId));

  void audit.roleChanged(doctorId, { action: "role_deleted", roleId, name: existing.name });

  revalidatePath("/doctor/roles");
  return { error: null };
}

// ── Staff permission manager (legacy `StaffPermissionController` parity) ───

/** Permission names held directly by a user (via model_has_permissions). */
export async function getUserPermissionNames(userId: number): Promise<string[]> {
  const rows = await db
    .select({ name: permissions.name })
    .from(permissions)
    .innerJoin(modelHasPermissions, eq(modelHasPermissions.permissionId, permissions.id))
    .where(and(eq(modelHasPermissions.modelId, userId), eq(modelHasPermissions.modelType, USER_MODEL)));
  return rows.map((r) => r.name);
}

export async function saveStaffPermissions(
  staffId: number,
  permissionNames: string[]
): Promise<RoleActionResult> {
  const doctorId = await requireDoctorPermission("roles-edit");
  if (!doctorId) return { error: "You don't have permission to edit staff permissions." };
  if (!staffId || !Number.isInteger(staffId)) return { error: "Invalid staff ID." };

  // The staff member must belong to this doctor.
  const [staff] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(and(eq(users.id, staffId), eq(users.referenceRoleId, doctorId), eq(users.role, "receptionist")));
  if (!staff) return { error: "Staff member not found." };

  const permissionIds = await parsePermissionInput(permissionNames);

  await db
    .delete(modelHasPermissions)
    .where(and(eq(modelHasPermissions.modelId, staffId), eq(modelHasPermissions.modelType, USER_MODEL)));
  if (permissionIds.length > 0) {
    await db
      .insert(modelHasPermissions)
      .values(permissionIds.map((permissionId) => ({ permissionId, modelType: USER_MODEL, modelId: staffId })));
  }

  void audit.roleChanged(doctorId, {
    action: "staff_permissions_saved",
    staffId,
    staffName: staff.name,
    permissions: permissionIds.length,
  });

  revalidatePath("/doctor/roles");
  return { error: null };
}