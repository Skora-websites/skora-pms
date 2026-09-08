/**
 * Server-only permission guard for the doctor dashboard.
 *
 * Kept in its own module (NOT in `lib/auth/permissions.ts`) so that the pure
 * route→permission map stays import-safe for client components. Anything in
 * this file may import `next/headers`-dependent helpers — it must never be
 * imported from a `"use client"` component.
 */

import { redirect } from "next/navigation";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { permissions, modelHasPermissions, modelHasRoles, roles } from "@/lib/db/schema";
import { getCurrentUser, hasPermission, homePathForRole } from "./user";

const USER_MODEL = "App\\Models\\User";

/**
 * Default module permissions a brand-new doctor gets so the dashboard is
 * usable out of the box (legacy Doctor role shipped with zero permissions
 * and every doctor 403'd until an admin assigned them). Super-admin can
 * still narrow them per doctor via the permissions dialog.
 */
export const DEFAULT_DOCTOR_MODULE_PERMS = [
  "dashboard",
  "schedule",
  "registrations",
  "appointments",
  "follow-up",
  "income-expense",
  "test-booking",
  "billing",
  "home-visit",
  "chat",
  "shop",
  "support",
  "roles-permissions",
] as const;

/** Grant a user direct model permissions by name (no-ops when unknown). */
export async function grantPermissionsByName(
  userId: number,
  names: readonly string[]
): Promise<void> {
  if (names.length === 0) return;
  const rows = await db
    .select({ id: permissions.id })
    .from(permissions)
    .where(inArray(permissions.name, names));
  if (rows.length === 0) return;
  await db.insert(modelHasPermissions).values(
    rows.map((r) => ({ permissionId: r.id, modelType: USER_MODEL, modelId: userId }))
  );
}

/** Attach a named system role (doctorId null) to a user, replacing any system roles. */
export async function attachSystemRole(userId: number, roleName: string): Promise<void> {
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

/**
 * Server-action guard: resolves the acting doctor id (redirecting to /login
 * when unauthenticated or out of role, like the per-file `getDoctorId`
 * helpers) and returns `null` when the user lacks the permission. Callers
 * should short-circuit with a user-facing error on `null`:
 *
 *   const doctorId = await requireDoctorPermission("billing-create");
 *   if (!doctorId) return { error: "You don't have permission to create bills." };
 *
 * Permission checks are React-cached per request (getUserPermissions), so
 * this adds no extra DB round-trips beyond the one the nav already does.
 */
export async function requireDoctorPermission(
  permission: string
): Promise<number | null> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["doctor", "receptionist", "admin"].includes(user.role)) {
    redirect(homePathForRole(user.role));
  }
  if (!(await hasPermission(user.id, permission))) return null;
  return user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
}
