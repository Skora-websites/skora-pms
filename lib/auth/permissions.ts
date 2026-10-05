/**
 * Doctor-dashboard permission model — single source of truth.
 *
 * The nav in `app/doctor/layout.tsx` and the server-action guards must agree
 * on which route maps to which module permission. Keeping the map here
 * prevents drift: the nav filters what a user sees, and the guards enforce
 * the same module server-side (URL access + direct action invocation).
 */

export type DoctorNavPerm =
  | "dashboard"
  | "schedule"
  | "registrations"
  | "appointments"
  | "follow-up"
  | "income-expense"
  | "test-booking"
  | "billing"
  | "home-visit"
  | "chat"
  | "shop"
  | "support"
  | "roles-permissions";

/** Longest-prefix first so `/doctor/appointments` wins over `/doctor`. */
export const DOCTOR_ROUTE_PERMISSIONS: { prefix: string; perm: DoctorNavPerm }[] = [
  { prefix: "/doctor/schedule", perm: "schedule" },
  { prefix: "/doctor/patients", perm: "registrations" },
  { prefix: "/doctor/appointments", perm: "appointments" },
  { prefix: "/doctor/follow-ups", perm: "follow-up" },
  { prefix: "/doctor/income-expense", perm: "income-expense" },
  { prefix: "/doctor/test-bookings", perm: "test-booking" },
  { prefix: "/doctor/billing", perm: "billing" },
  { prefix: "/doctor/home-visits", perm: "home-visit" },
  { prefix: "/doctor/chat", perm: "chat" },
  { prefix: "/doctor/shop", perm: "shop" },
  { prefix: "/doctor/support", perm: "support" },
  { prefix: "/doctor/staff", perm: "roles-permissions" },
  { prefix: "/doctor/roles", perm: "roles-permissions" },
  // Dashboard-scoped pages: not visible without the dashboard module.
  { prefix: "/doctor/emergency", perm: "dashboard" },
  { prefix: "/doctor/consultations", perm: "dashboard" },
  { prefix: "/doctor/online-consultations", perm: "dashboard" },
  { prefix: "/doctor/notifications", perm: "dashboard" },
  { prefix: "/doctor/faq", perm: "dashboard" },
  { prefix: "/doctor/consult-pdf", perm: "dashboard" },
  { prefix: "/doctor/profile", perm: "dashboard" },
  { prefix: "/doctor/settings", perm: "dashboard" },
  { prefix: "/doctor", perm: "dashboard" },
];

/** Module permission required for a doctor-dashboard pathname (or null). */
export function doctorPermissionForPath(pathname: string): DoctorNavPerm | null {
  for (const { prefix, perm } of DOCTOR_ROUTE_PERMISSIONS) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return perm;
  }
  return null;
}

// ── Admin-tier (business owner + clinic manager) URL-space ────────────
// The /admin shell serves BOTH tiers from one role-adaptive layout:
//   - owners (`admin` role) see everything of their businesses — module
//     permission checks are bypassed for them, so no DB grants are needed;
//   - managers (`manager` role) hold a subset of the SAME module permission
//     names the doctor dashboard uses (dashboard, schedule, registrations,
//     appointments, follow-up, test-booking, billing, income-expense,
//     roles-permissions) — assigned directly (model_has_permissions) when
//     the owner creates them, so the existing permission catalog and
//     getUserPermissions() expansion keep working unchanged.
// Owner-only modules (managers/clinics/business-settings) are gated on the
// viewer role itself — they can't be delegated to a manager by design.

export type AdminNavPerm =
  | "dashboard"
  | "schedule"
  | "registrations"
  | "appointments"
  | "follow-up"
  | "income-expense"
  | "test-booking"
  | "billing"
  | "home-visit"
  | "chat"
  | "shop"
  | "support"
  | "consultations"
  | "online-consultations"
  | "roles-permissions"
  | "managers"
  | "clinics"
  | "business-settings";

/** Longest-prefix first so `/admin/appointments` wins over `/admin`. */
export const ADMIN_ROUTE_PERMISSIONS: { prefix: string; perm: AdminNavPerm; ownerOnly?: boolean }[] = [
  // Owner-only modules
  { prefix: "/admin/managers", perm: "managers", ownerOnly: true },
  { prefix: "/admin/clinics", perm: "clinics", ownerOnly: true },
  { prefix: "/admin/settings", perm: "business-settings", ownerOnly: true },
  // Shared clinic-ops modules (owner bypasses; managers need the perm)
  { prefix: "/admin/schedule", perm: "schedule" },
  { prefix: "/admin/patients", perm: "registrations" },
  { prefix: "/admin/appointments", perm: "appointments" },
  { prefix: "/admin/follow-ups", perm: "follow-up" },
  { prefix: "/admin/income-expense", perm: "income-expense" },
  { prefix: "/admin/test-bookings", perm: "test-booking" },
  { prefix: "/admin/billing", perm: "billing" },
  // Owner-parity modules (D1): the /doctor modules the Business Owner gets
  // too — Emergency stays doctor-only. Managers can be granted these.
  { prefix: "/admin/home-visits", perm: "home-visit" },
  { prefix: "/admin/chat", perm: "chat" },
  { prefix: "/admin/shop", perm: "shop" },
  { prefix: "/admin/support", perm: "support" },
  { prefix: "/admin/consultations", perm: "consultations" },
  { prefix: "/admin/online-consultations", perm: "online-consultations" },
  { prefix: "/admin/staff", perm: "roles-permissions" },
  { prefix: "/admin", perm: "dashboard" },
];

/** Module permission required for an admin-tier pathname (or null). */
export function adminPermissionForPath(pathname: string): AdminNavPerm | null {
  for (const { prefix, perm } of ADMIN_ROUTE_PERMISSIONS) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return perm;
  }
  return null;
}

/**
 * Admin-tier page access: owners pass everything; managers need the module
 * perm (owner-only modules always fail for them).
 */
export function hasAdminModuleAccess(
  perms: Set<string>,
  pathname: string,
  viewerRole: "owner" | "manager"
): boolean {
  if (viewerRole === "owner") return true;
  const entry = ADMIN_ROUTE_PERMISSIONS.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
  if (!entry) return true;
  return !entry.ownerOnly && perms.has(entry.perm);
}

/**
 * First admin-tier path the viewer may see, in nav order. Owners always
 * start at the overview; managers fall back to it when they hold no module.
 */
export function firstPermittedAdminPath(
  perms: Set<string>,
  viewerRole: "owner" | "manager"
): string {
  if (viewerRole === "owner") return "/admin";
  const order: { perm: AdminNavPerm; path: string }[] = [
    { perm: "dashboard", path: "/admin" },
    { perm: "schedule", path: "/admin/schedule" },
    { perm: "registrations", path: "/admin/patients" },
    { perm: "appointments", path: "/admin/appointments" },
    { perm: "follow-up", path: "/admin/follow-ups" },
    { perm: "income-expense", path: "/admin/income-expense" },
    { perm: "test-booking", path: "/admin/test-bookings" },
    { perm: "billing", path: "/admin/billing" },
    { perm: "home-visit", path: "/admin/home-visits" },
    { perm: "chat", path: "/admin/chat" },
    { perm: "shop", path: "/admin/shop" },
    { perm: "support", path: "/admin/support" },
    { perm: "consultations", path: "/admin/consultations" },
    { perm: "online-consultations", path: "/admin/online-consultations" },
    { perm: "roles-permissions", path: "/admin/staff" },
  ];
  for (const { perm, path } of order) {
    if (perms.has(perm)) return path;
  }
  return "/admin";
}

/**
 * First path the user is permitted to see, in nav order. Used to redirect
 * users who try to open a page outside their permission set.
 */
export function firstPermittedDoctorPath(perms: Set<string>): string {
  const order: { perm: DoctorNavPerm; path: string }[] = [
    { perm: "dashboard", path: "/doctor" },
    { perm: "schedule", path: "/doctor/schedule" },
    { perm: "registrations", path: "/doctor/patients" },
    { perm: "appointments", path: "/doctor/appointments" },
    { perm: "follow-up", path: "/doctor/follow-ups" },
    { perm: "income-expense", path: "/doctor/income-expense" },
    { perm: "test-booking", path: "/doctor/test-bookings" },
    { perm: "billing", path: "/doctor/billing" },
    { perm: "home-visit", path: "/doctor/home-visits" },
    { perm: "chat", path: "/doctor/chat" },
    { perm: "shop", path: "/doctor/shop" },
    { perm: "support", path: "/doctor/support" },
    { perm: "roles-permissions", path: "/doctor/staff" },
  ];
  for (const { perm, path } of order) {
    if (perms.has(perm)) return path;
  }
  return "/doctor";
}

export function hasDoctorModuleAccess(perms: Set<string>, pathname: string): boolean {
  const required = doctorPermissionForPath(pathname);
  if (!required) return true;
  return perms.has(required);
}

// ── Receptionist panel URL-space ──────────────────────────────────────
// Receptionists browse the same dashboard routes under /receptionist/* (the
// proxy rewrites them onto /doctor/*). These helpers translate between the
// two prefixes so guards and redirects speak the visitor's language.

/** "/doctor/…" → "/receptionist/…" (receptionist-facing URL). */
export function doctorPathToReceptionist(path: string): string {
  return path === "/doctor" ? "/receptionist" : path.replace(/^\/doctor(?=\/|$)/, "/receptionist");
}

/** "/receptionist/…" → "/doctor/…" (internal route). */
export function receptionistPathToDoctor(path: string): string {
  return path === "/receptionist" ? "/doctor" : path.replace(/^\/receptionist(?=\/|$)/, "/doctor");
}
