/**
 * US3/T031 — one helper answers "where does this link go for this caller".
 *
 * Audit H8/H9: components shared between /admin and /doctor hardcoded
 * /doctor/* hrefs, so an owner clicking a consultation row or the
 * notifications bell was bounced out of their own panel (or hit a 403 on an
 * API that admitted only doctor/receptionist). lib/auth/shell-paths.ts is now
 * the single source of truth; every cross-shell link in components/ resolves
 * through it.
 *
 * This suite pins the graph: for every page purpose the helper exports, the
 * admin and doctor destinations differ (that is the whole point of the
 * helper), a receptionist's destination is the translated staff path and never
 * the raw /doctor one, and a purpose a shell cannot use returns an explicit
 * null rather than a link that would bounce. The API purposes (test-report,
 * consultation-terms PDF) intentionally share one route; their matrix pins
 * which shells audit H11 admits.
 *
 * Run: npm run test
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  consultationDetailPath,
  consultPdfPath,
  normalizeShell,
  notificationsPath,
  profilePath,
  testReportPath,
} from "../shell-paths";

const APPOINTMENT_ID = 4242;
const BOOKING_ID = 99;

/** URL space each shell owns — a page link must live inside the caller's own. */
const SHELL_SEGMENT: Record<string, string> = {
  admin: "/admin",
  doctor: "/doctor",
  receptionist: "/receptionist",
  patient: "/patient",
  super_admin: "/super-admin",
};

/**
 * Page-destination results per purpose and shell, resolved once — the helper
 * is pure, so the table is the fixture.
 */
const PAGE_DESTINATIONS: Record<string, Record<string, string | null>> = {
  consultationDetailPath: {
    admin: consultationDetailPath("admin", APPOINTMENT_ID),
    doctor: consultationDetailPath("doctor", APPOINTMENT_ID),
    receptionist: consultationDetailPath("receptionist", APPOINTMENT_ID),
    patient: consultationDetailPath("patient", APPOINTMENT_ID),
    super_admin: consultationDetailPath("super_admin", APPOINTMENT_ID),
  },
  notificationsPath: {
    admin: notificationsPath("admin"),
    doctor: notificationsPath("doctor"),
    receptionist: notificationsPath("receptionist"),
    patient: notificationsPath("patient"),
    super_admin: notificationsPath("super_admin"),
  },
  profilePath: {
    admin: profilePath("admin"),
    doctor: profilePath("doctor"),
    receptionist: profilePath("receptionist"),
    patient: profilePath("patient"),
    super_admin: profilePath("super_admin"),
  },
};

test("a display label and a raw role resolve to the same shell", () => {
  // The admin layout passes "Business Owner"/"Clinic Manager" as user.role and
  // the super-admin layout passes "PMS Admin"; matching the label wrongly
  // classified both shells.
  assert.equal(normalizeShell("Business Owner"), "admin");
  assert.equal(normalizeShell("Clinic Manager"), "admin");
  assert.equal(normalizeShell("PMS Admin"), "super_admin");
  assert.equal(normalizeShell("admin"), "admin");
  assert.equal(normalizeShell("manager"), "admin");
  assert.equal(normalizeShell("super_admin"), "super_admin");
  assert.equal(normalizeShell("doctor"), "doctor");
  assert.equal(normalizeShell("receptionist"), "receptionist");
  assert.equal(normalizeShell("patient"), "patient");
  assert.equal(normalizeShell("unexpected-label"), "doctor");
  assert.equal(normalizeShell(null), "doctor");
  assert.equal(normalizeShell(undefined), "doctor");
});

test("admin and doctor destinations differ for every page purpose", () => {
  for (const [purpose, byShell] of Object.entries(PAGE_DESTINATIONS)) {
    assert.notEqual(
      byShell.admin,
      byShell.doctor,
      `${purpose} sends admin and doctor to the same page — the helper is not translating`
    );
  }
});

test("every page destination lives inside the caller's own shell", () => {
  for (const [purpose, byShell] of Object.entries(PAGE_DESTINATIONS)) {
    for (const [shell, result] of Object.entries(byShell)) {
      if (result === null) continue;
      const segment = SHELL_SEGMENT[shell];
      assert.ok(
        result.startsWith(segment),
        `${purpose} for shell ${shell} returned ${result}, outside ${segment}`
      );
    }
  }
});

test("no shell is handed the raw /doctor URL of another shell", () => {
  for (const [purpose, byShell] of Object.entries(PAGE_DESTINATIONS)) {
    for (const [shell, result] of Object.entries(byShell)) {
      if (result === null || shell === "doctor") continue;
      assert.ok(
        !result.startsWith("/doctor"),
        `${purpose} handed ${shell} a doctor-shell URL: ${result}`
      );
    }
  }
});

test("a receptionist's destinations are the translated staff paths", () => {
  // Receptionist links must go through the prefix translator (the receptionist
  // panel mirrors the doctor URLs under /receptionist).
  assert.equal(PAGE_DESTINATIONS.notificationsPath.receptionist, "/receptionist/notifications");
  assert.equal(PAGE_DESTINATIONS.profilePath.receptionist, "/receptionist/profile");
});

test("shells without a destination get an explicit null, never a bounce", () => {
  assert.equal(PAGE_DESTINATIONS.consultationDetailPath.receptionist, null);
  assert.equal(PAGE_DESTINATIONS.consultationDetailPath.patient, null);
  assert.equal(PAGE_DESTINATIONS.consultationDetailPath.super_admin, null);
  assert.equal(PAGE_DESTINATIONS.notificationsPath.patient, null);
  assert.equal(PAGE_DESTINATIONS.notificationsPath.super_admin, null);
});

test("the API purposes admit the shells audit H11 allows and refuse the rest", () => {
  // The consultation-terms PDF may be read by admins and doctors but must not
  // be reachable (writable) by receptionists; the test-report route is a
  // staff-tier concern so patients and platform admins are refused.
  assert.equal(consultPdfPath("admin"), "/api/doctor/consult-pdf");
  assert.equal(consultPdfPath("doctor"), "/api/doctor/consult-pdf");
  assert.equal(consultPdfPath("receptionist"), null);
  assert.equal(consultPdfPath("patient"), null);
  assert.equal(consultPdfPath("super_admin"), null);

  assert.equal(
    testReportPath("doctor", BOOKING_ID),
    `/api/doctor/test-bookings/${BOOKING_ID}/report`
  );
  assert.equal(
    testReportPath("receptionist", BOOKING_ID),
    `/api/doctor/test-bookings/${BOOKING_ID}/report`
  );
  assert.equal(
    testReportPath("admin", BOOKING_ID),
    `/api/doctor/test-bookings/${BOOKING_ID}/report`
  );
  assert.equal(testReportPath("patient", BOOKING_ID), null);
  assert.equal(testReportPath("super_admin", BOOKING_ID), null);
});
