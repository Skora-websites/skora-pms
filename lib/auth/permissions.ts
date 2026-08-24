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
