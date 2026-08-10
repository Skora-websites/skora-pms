import { redirect } from "next/navigation";
import { getCurrentUser, hasPermission, homePathForRole } from "./user";

/** Redirects to /login when unauthenticated, or to the user's home when the role doesn't match. */
export async function requireRole(roles: string[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!roles.includes(user.role)) redirect(homePathForRole(user.role));
  return user;
}

/** Same as requireRole but also requires a permission name. */
export async function requireRoleWithPermission(roles: string[], permission: string) {
  const user = await requireRole(roles);
  const ok = await hasPermission(user.id, permission);
  if (!ok) redirect(homePathForRole(user.role));
  return user;
}
