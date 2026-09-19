import { cache } from "react";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  users,
  roles,
  modelHasRoles,
  roleHasPermissions,
  permissions,
  modelHasPermissions,
} from "@/lib/db/schema";
import { getSessionUserId } from "./session";

const USER_MODEL = "App\\Models\\User";

export type CurrentUser = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string | null;
  onDuty: boolean | null;
  clinicOnDuty: boolean | null;
  homeVisitOnDuty: boolean | null;
  profilePhotoPath: string | null;
  signaturePath: string | null;
  notificationPreferences: unknown;
  doctorId: number | null;
  qualification: string | null;
  specialization: string | null;
  registrationNumber: string | null;
  salutation: string | null;
  trialEndsAt: Date | null;
  createdAt: Date | null;
};

/** Fetch the logged-in user (or null). Cached per request via React cache(). */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      status: users.status,
      onDuty: users.onDuty,
      clinicOnDuty: users.clinicOnDuty,
      homeVisitOnDuty: users.homeVisitOnDuty,
      profilePhotoPath: users.profilePhotoPath,
      signaturePath: users.signaturePath,
      notificationPreferences: users.notificationPreferences,
      doctorId: users.doctorId,
      referenceRoleId: users.referenceRoleId,
      qualification: users.qualification,
      specialization: users.specialization,
      registrationNumber: users.registrationNumber,
      salutation: users.salutation,
      trialEndsAt: users.trialEndsAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId));

  // Business rule: a deactivated account must not retain access through an
  // existing session. Login already blocks inactive users; this closes the
  // "already logged in" gap (session stays valid after super-admin
  // deactivates the account).
  if (row && row.status && row.status !== "active") return null;
  if (!row) return null;

  // Legacy/migrated staff rows have doctor_id = NULL but carry their doctor's
  // id in reference_role_id (spatie team semantics). Without this fallback
  // every receptionist-scoped query resolves to the staff member's own id
  // and returns empty data right after login.
  return {
    ...row,
    doctorId: row.doctorId ?? row.referenceRoleId,
  };
});

/** Set of permission names the user holds (direct + via roles). */
export const getUserPermissions = cache(
  async (userId: number): Promise<Set<string>> => {
    const permSet = new Set<string>();

    // Direct model permissions
    const direct = await db
      .select({ name: permissions.name })
      .from(permissions)
      .innerJoin(
        modelHasPermissions,
        eq(modelHasPermissions.permissionId, permissions.id)
      )
      .where(
        and(
          eq(modelHasPermissions.modelId, userId),
          eq(modelHasPermissions.modelType, USER_MODEL)
        )
      );
    direct.forEach((p) => permSet.add(p.name));

    // Role-based permissions
    const roleRows = await db
      .select({ roleId: modelHasRoles.roleId })
      .from(modelHasRoles)
      .where(
        and(
          eq(modelHasRoles.modelId, userId),
          eq(modelHasRoles.modelType, USER_MODEL)
        )
      );
    const roleIds = roleRows.map((r) => r.roleId);
    if (roleIds.length > 0) {
      const rolePerms = await db
        .select({ name: permissions.name })
        .from(permissions)
        .innerJoin(
          roleHasPermissions,
          eq(roleHasPermissions.permissionId, permissions.id)
        )
        .where(inArray(roleHasPermissions.roleId, roleIds));
      rolePerms.forEach((p) => permSet.add(p.name));
    }

    // ── Module expansion (team-login fix) ──
    // The nav + route guards check the PARENT module perm ("schedule",
    // "registrations", …), but roles granted via the UI (or legacy data) may
    // only carry action-level children ("schedule-list", "billing-create", …)
    // without the parent row. Granting any action of a module implies access
    // to that module — expand the set so restricted staff aren't bounced to
    // the landing page right after logging in.
    if (permSet.size > 0) {
      const allPerms = await db
        .select({ id: permissions.id, name: permissions.name, parentId: permissions.parentId })
        .from(permissions);
      const nameById = new Map(allPerms.map((p) => [p.id, p.name]));
      for (const p of allPerms) {
        if (permSet.has(p.name) && p.parentId !== null) {
          const parentName = nameById.get(p.parentId);
          if (parentName) permSet.add(parentName);
        }
      }
    }

    return permSet;
  }
);

export async function hasPermission(userId: number, permission: string) {
  const perms = await getUserPermissions(userId);
  return perms.has(permission);
}

export async function hasAnyPermission(userId: number, names: string[]) {
  const perms = await getUserPermissions(userId);
  return names.some((n) => perms.has(n));
}

export type UserRole =
  | "super_admin"
  | "admin"
  | "doctor"
  | "receptionist"
  | "patient";

export const ROLE_HOME: Record<UserRole, string> = {
  super_admin: "/super-admin",
  admin: "/super-admin",
  doctor: "/doctor",
  receptionist: "/doctor",
  patient: "/patient",
};

export function homePathForRole(role: string): string {
  return ROLE_HOME[role as UserRole] ?? "/";
}

export async function roleNames(userId: number) {
  const rows = await db
    .select({ name: roles.name })
    .from(roles)
    .innerJoin(modelHasRoles, eq(modelHasRoles.roleId, roles.id))
    .where(
      and(
        eq(modelHasRoles.modelId, userId),
        eq(modelHasRoles.modelType, USER_MODEL)
      )
    );
  return rows.map((r) => r.name);
}
