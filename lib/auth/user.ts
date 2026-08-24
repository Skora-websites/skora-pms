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
  profilePhotoPath: string | null;
  signaturePath: string | null;
  notificationPreferences: unknown;
  doctorId: number | null;
  qualification: string | null;
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
      profilePhotoPath: users.profilePhotoPath,
      signaturePath: users.signaturePath,
      notificationPreferences: users.notificationPreferences,
      doctorId: users.doctorId,
      qualification: users.qualification,
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

  return row ?? null;
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
