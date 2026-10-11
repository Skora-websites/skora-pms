import { redirect } from "next/navigation";
import { getCurrentUser, getUserPermissions, hasPermission, homePathForRole, isTrialExpired, type CurrentUser } from "./user";
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

/**
 * API-route variant of requireRole: returns the user on success, or a ready
 * Response (401/403) for the handler to return. Route handlers must never
 * use the redirect() guards — next/navigation's redirect degrades to an
 * opaque 307 there, sending authenticated tenants chasing an HTML page
 * instead of answering with a machine-readable status (the NV-1 regression
 * class: an owner must get exactly 403 on /api/super-admin/*).
 */
export async function requireApiRole(
  roles: string[]
): Promise<CurrentUser | Response> {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!roles.includes(user.role)) return new Response("Forbidden", { status: 403 });
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
 * API-route module-permission guard (audit F-01): authorizes on role AND the
 * module permission the layout already requires for the same feature, so a
 * page and its data endpoints cannot drift (both read DOCTOR_ROUTE_PERMISSIONS
 * / ADMIN_ROUTE_PERMISSIONS names). The layout guard only runs on page
 * renders — without this, a direct HTTP request skips it entirely.
 *
 * Owner bypass: the `admin` role skips module permissions by design, matching
 * requireAdminTier (an owner holds no DB grants). Every other staff tier —
 * doctor, receptionist, manager — must hold the module permission.
 *
 * Returns the user on success, or a ready 401/403 Response for the handler
 * to return (never redirect — see requireApiRole).
 */
export async function requireApiPermission(
  roles: string[],
  permission: string
): Promise<CurrentUser | Response> {
  const user = await requireApiRole(roles);
  if (user instanceof Response) return user;
  // Trial expiry applies to the API surface too (audit F-03) — only doctors
  // carry a trial, so staff tiers are unaffected.
  if (isTrialExpired(user)) return new Response("Forbidden", { status: 403 });
  if (user.role === "admin") return user; // owner bypass — requireAdminTier parity
  const ok = await hasPermission(user.id, permission);
  if (!ok) return new Response("Forbidden", { status: 403 });
  return user;
}

/**
 * Doctor-only API guard (audit F-02): panels the product restricts to
 * doctors regardless of permissions — emergency dispatch and consultation
 * records. The doctor layout hard-bounces receptionists from these pages
 * (a deliberate product boundary, not a permission decision); this applies
 * the same rule to the underlying data endpoints, which the layout cannot
 * reach.
 */
export async function requireApiDoctorOnly(
  roles: string[] = ["doctor"]
): Promise<CurrentUser | Response> {
  const user = await requireApiRole(roles);
  if (user instanceof Response) return user;
  if (isTrialExpired(user)) return new Response("Forbidden", { status: 403 });
  if (user.role !== "doctor") return new Response("Forbidden", { status: 403 });
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
