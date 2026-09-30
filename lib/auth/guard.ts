import { redirect } from "next/navigation";
import { getCurrentUser, getUserPermissions, hasPermission, homePathForRole, type CurrentUser } from "./user";
import {
  hasAdminModuleAccess,
  firstPermittedAdminPath,
  type AdminNavPerm,
} from "./permissions";

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

/**
 * Admin-tier page guard for the /admin shell: admits admins (owners) and
 * managers only, then enforces the per-route module map server-side (before
 * page data is fetched) — the same x-pathname pattern as the doctor layout.
 *
 * Returns the user plus their resolved viewerRole so pages/actions can
 * branch without re-deriving it.
 */
export async function requireAdminTier(pathname?: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin" && user.role !== "manager") {
    redirect(homePathForRole(user.role));
  }
  const viewerRole = user.role === "admin" ? ("owner" as const) : ("manager" as const);

  if (pathname) {
    const perms =
      viewerRole === "owner" ? new Set<string>() : await getUserPermissions(user.id);
    if (!hasAdminModuleAccess(perms, pathname, viewerRole)) {
      const target = firstPermittedAdminPath(perms, viewerRole);
      // Avoid a redirect loop when the fallback is the page itself (a manager
      // with zero modules landing on /admin) — same escape as the doctor
      // layout: bounce to the public site instead of looping forever.
      redirect(target === pathname ? "/" : target);
    }
  }

  return { user, viewerRole };
}

/**
 * Server-action guard for admin-tier writes. Managers must hold the module
 * permission; owners always pass. Returns null (don't throw — callers reply
 * with a user-facing error, matching requireDoctorPermission's contract)
 * when the caller lacks the module; owner-only modules additionally need
 * `viewerRole: "owner"`.
 */
export async function requireAdminPermission(
  permission: AdminNavPerm,
  opts: { ownerOnly?: boolean } = {}
): Promise<{ user: CurrentUser; viewerRole: "owner" | "manager" } | null> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin" && user.role !== "manager") {
    redirect(homePathForRole(user.role));
  }
  if (user.role === "admin") return { user, viewerRole: "owner" as const };
  if (opts.ownerOnly) return null;
  const ok = await hasPermission(user.id, permission);
  if (!ok) return null;
  return { user, viewerRole: "manager" as const };
}
