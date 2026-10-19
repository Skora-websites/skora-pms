/**
 * Cross-shell link translation — single source of truth for internal links
 * that must resolve inside the CALLER's panel.
 *
 * Why this exists: components shared between `/admin` and `/doctor` used to
 * hardcode `/doctor/*` hrefs. An owner clicking them hit
 * `requireRole(["doctor","receptionist"])` in the doctor layout and was
 * silently bounced out of their own panel; an owner clicking "View report"
 * got a 403 from an API that only admits doctor/receptionist. One module now
 * answers "where does this link go for this caller", so a new shared
 * component cannot reintroduce the defect.
 *
 * Import-safe for client components: this file imports nothing from the
 * database or `next/*`, only the pure prefix translators in
 * `./permissions` (same rule that keeps `permissions.ts` client-safe).
 *
 * `normalizeShell` accepts either a real role or the display label a layout
 * passes as `user.role`, because those differ today:
 *   app/admin/layout.tsx        → "Business Owner" | "Clinic Manager"
 *   app/super-admin/layout.tsx  → "PMS Admin"
 *   the rest                    → the real role
 * Matching on the raw string, as the header used to, silently mis-classifies
 * the admin and super-admin shells (the super-admin notification bell checks
 * `role !== "super_admin"`, which never matches "PMS Admin").
 */

import { doctorPathToReceptionist } from "./permissions";

export type Shell = "admin" | "doctor" | "receptionist" | "patient" | "super_admin";

/** Map a role value or display label onto the shell that owns its URL space. */
export function normalizeShell(roleOrLabel: string | null | undefined): Shell {
  switch (roleOrLabel) {
    case "super_admin":
    case "PMS Admin":
      return "super_admin";
    case "patient":
      return "patient";
    case "receptionist":
      return "receptionist";
    case "admin":
    case "manager":
    case "Business Owner":
    case "Clinic Manager":
      return "admin";
    default:
      return "doctor";
  }
}

/**
 * Per-appointment consultation detail. Receptionists are excluded by
 * `DOCTOR_ONLY_PATHS` (the consultation flow is clinical, not front-desk);
 * the admin route is the owner-parity detail view.
 */
export function consultationDetailPath(
  shell: Shell,
  appointmentId: number | string
): string | null {
  switch (shell) {
    case "doctor":
      return `/doctor/consultations/${appointmentId}`;
    case "admin":
      return `/admin/consultations/${appointmentId}`;
    default:
      return null;
  }
}

/** In-app notification centre. */
export function notificationsPath(shell: Shell): string | null {
  switch (shell) {
    case "doctor":
      return "/doctor/notifications";
    case "receptionist":
      return doctorPathToReceptionist("/doctor/notifications");
    case "admin":
      return "/admin/notifications";
    default:
      return null;
  }
}

/** Own-profile page. Patients land on their dashboard; super admins on settings. */
export function profilePath(shell: Shell): string | null {
  switch (shell) {
    case "doctor":
      return "/doctor/profile";
    case "receptionist":
      return doctorPathToReceptionist("/doctor/profile");
    case "admin":
      return "/admin/profile";
    case "patient":
      return "/patient";
    case "super_admin":
      return "/super-admin/settings";
  }
}

/**
 * Test-report download. Receptionists keep access (the test-booking module is
 * a staff-tier concern); patients and platform admins have no route into a
 * clinic's booking record.
 */
export function testReportPath(shell: Shell, bookingId: number | string): string | null {
  switch (shell) {
    case "doctor":
    case "receptionist":
    case "admin":
      return `/api/doctor/test-bookings/${bookingId}/report`;
    default:
      return null;
  }
}

/**
 * Doctor consultation-terms PDF. Admins may audit the terms their clinics use;
 * receptionists may not overwrite them.
 */
export function consultPdfPath(shell: Shell): string | null {
  switch (shell) {
    case "doctor":
    case "admin":
      return "/api/doctor/consult-pdf";
    default:
      return null;
  }
}
