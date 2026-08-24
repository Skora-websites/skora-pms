/**
 * Server-only permission guard for the doctor dashboard.
 *
 * Kept in its own module (NOT in `lib/auth/permissions.ts`) so that the pure
 * route→permission map stays import-safe for client components. Anything in
 * this file may import `next/headers`-dependent helpers — it must never be
 * imported from a `"use client"` component.
 */

import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission, homePathForRole } from "./user";

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
