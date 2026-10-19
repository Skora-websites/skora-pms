/**
 * US8 — the doctor-panel boundary is decided in ONE place.
 *
 * Audit M7: the server bounce (app/doctor/layout.tsx) and the client gate
 * (components/doctor/permission-gate.tsx) each implemented the rule separately,
 * and the client gate omitted DOCTOR_ONLY_PATHS — so the two could disagree and
 * a receptionist holding the module permission saw a clinical page render
 * before the server redirected them away.
 *
 * Both now call `resolveDoctorPanelRedirect`. These tests pin the shared rule,
 * including the ordering that caused the original drift: the doctor-only
 * boundary is checked BEFORE module permissions.
 *
 * Run: npm run test
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DOCTOR_ONLY_PATHS,
  doctorPathToReceptionist,
  doctorPermissionForPath,
  resolveDoctorPanelRedirect,
} from "../permissions";

const CLINICAL = new Set(["dashboard", "appointments", "schedule", "follow-up", "support"]);

test("a receptionist is bounced from every doctor-only path, even holding its module", () => {
  // A receptionist granted every module still must not open a clinical page.
  const everything = new Set([
    ...CLINICAL,
    ...[...DOCTOR_ONLY_PATHS].map((p) => doctorPermissionForPath(p) ?? "dashboard"),
  ]);
  for (const path of DOCTOR_ONLY_PATHS) {
    assert.equal(
      resolveDoctorPanelRedirect(path, true, everything),
      "/receptionist",
      `${path} is doctor-only and must bounce the receptionist to /receptionist`
    );
  }
});

test("nested doctor-only paths bounce too, not just the exact route", () => {
  const everything = new Set([...CLINICAL, "dashboard"]);
  assert.equal(
    resolveDoctorPanelRedirect("/doctor/consultations/42", true, everything),
    "/receptionist",
    "a consultation detail URL must bounce, not just /doctor/consultations"
  );
});

test("a receptionist with the module permission stays on a permitted staff path", () => {
  const perms = new Set([...CLINICAL, "dashboard"]);
  assert.equal(
    resolveDoctorPanelRedirect("/doctor/appointments", true, perms),
    null,
    "appointments are a staff-tier module: no redirect"
  );
});

test("a receptionist without the module is redirected to their first permitted path", () => {
  const perms = new Set(["dashboard", "schedule"]);
  // The resolver speaks the DOCTOR shell; the caller translates to
  // /receptionist/* (doctorPathToReceptionist) for the browser URL.
  const target = resolveDoctorPanelRedirect("/doctor/appointments", true, perms);
  assert.equal(target, "/doctor", "first permitted path is the dashboard module");
  assert.equal(doctorPathToReceptionist(target!), "/receptionist", "then translated for the visitor");
});

test("the receptionist's redirected landing path is a path they may actually see", () => {
  // Regression guard: a redirect that lands on another forbidden page would
  // bounce forever.
  const perms = new Set(["dashboard", "schedule"]);
  const first = resolveDoctorPanelRedirect("/doctor/appointments", true, perms)!;
  const landing = doctorPathToReceptionist(first);
  assert.equal(
    resolveDoctorPanelRedirect(landing, true, perms),
    null,
    `the landing path ${landing} must itself be permitted`
  );
});

test("a doctor with the module permission is never bounced by the doctor-only rule", () => {
  const perms = new Set([...CLINICAL, "dashboard"]);
  for (const path of DOCTOR_ONLY_PATHS) {
    assert.equal(
      resolveDoctorPanelRedirect(path, false, perms),
      null,
      `${path} belongs to the doctor tier and must render for a doctor`
    );
  }
});

test("a doctor without the module permission is redirected, and never to itself", () => {
  const perms = new Set(["schedule"]);
  const target = resolveDoctorPanelRedirect("/doctor/appointments", false, perms);
  assert.equal(target, "/doctor/schedule");
  assert.notEqual(target, "/doctor/appointments", "never redirect a page to itself");
});

test("the doctor-only boundary outranks the module permission", () => {
  // The regression guard for M7: with the module held, a doctor-only path must
  // still bounce — if this ever returns null, the client gate has drifted again.
  const perms = new Set([...CLINICAL, "dashboard", "consultations", "online-consultations"]);
  assert.equal(
    resolveDoctorPanelRedirect("/doctor/emergency", true, perms),
    "/receptionist",
    "doctor-only must be enforced BEFORE the module check"
  );
});
