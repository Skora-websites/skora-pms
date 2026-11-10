/**
 * `reschedulePatientAppointment` — patient self-serve reschedule
 * (audit UX §7.2.4 / roadmap P3).
 *
 * The REAL action module is driven, with the session reader stubbed to a
 * fixture user (see tests/helpers/doctor-session-stub.ts — role-agnostic,
 * the same module serves the doctor suites). What is under test:
 *
 *  1. happy path: a future appointment moves to a new in-schedule time and
 *     the DB row is updated (in the legacy "H:MM AM/PM" format);
 *  2. ownership: another patient's appointment id is "not found";
 *  3. a reschedule to the slot it already occupies is refused as a no-op;
 *  4. a time outside the doctor's schedule is refused (availability rules
 *     shared with booking);
 *  5. a slot another patient already holds is refused under the doctor-row
 *     lock.
 *
 * Run: npm test (needs the live MySQL — same as the other fixture suites).
 */

import "dotenv/config";

import { test } from "node:test";
import assert from "node:assert/strict";
import * as nodeModule from "node:module";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments, doctorSchedules } from "@/lib/db/schema";
import { withCleanFixtures } from "../../../../tests/helpers/db";
import { makeUser, makeClinic, makeAppointment } from "../../../../tests/helpers/fixtures";
import * as fixtureSession from "../../../../tests/helpers/doctor-session-stub";

const SPECIFIER_STUBS: Record<string, string> = {
  "next/navigation": "../../../../tests/helpers/next-stubs.ts",
  "next/cache": "../../../../tests/helpers/next-stubs.ts",
  "next/headers": "../../../../tests/helpers/next-stubs.ts",
  "@/lib/auth/user": "../../../../tests/helpers/doctor-session-stub.ts",
};

const STUB_URLS = Object.values(SPECIFIER_STUBS).map(
  (relative) => new URL(relative, import.meta.url).href
);

type ResolveHook = (
  specifier: string,
  context: unknown,
  nextResolve: (specifier: string, context: unknown) => { url: string }
) => { url: string };

type ModuleWithHooks = { registerHooks: (hooks: { resolve: ResolveHook }) => void };
const moduleWithHooks = nodeModule as unknown as ModuleWithHooks;

moduleWithHooks.registerHooks({
  resolve(specifier, context, nextResolve) {
    // The action modules import the session module BOTH ways — `@/lib/auth/user`
    // (alias) and `./user` (relative). Matching by RESOLVED path covers both.
    const resolved = nextResolve(specifier, context);
    if (resolved.url.replace(/\\/g, "/").endsWith("/lib/auth/user.ts")) {
      return { url: STUB_URLS[3], shortCircuit: true };
    }
    const stubIndex = Object.keys(SPECIFIER_STUBS).indexOf(specifier);
    if (stubIndex !== -1) {
      return { url: STUB_URLS[stubIndex], shortCircuit: true };
    }
    return { url: resolved.url, shortCircuit: true };
  },
});

// EXCEPTION (dynamic import): must stay below registerHooks — see tier.test.ts.
let actions: typeof import("../actions") | undefined;
async function loadActions() {
  actions ??= (await import("../actions")) as typeof import("../actions");
  return actions;
}

/** The next Monday strictly in the future, as YYYY-MM-DD. */
function nextMonday(): string {
  const d = new Date();
  const delta = ((1 - d.getDay()) + 7) % 7 || 7;
  d.setDate(d.getDate() + delta);
  return d.toLocaleDateString("en-CA");
}

/** A 09:00–17:00 full-day schedule for the fixture doctor's clinic. */
async function makeSchedule(clinicId: number, doctorId: number, day: string) {
  await db.insert(doctorSchedules).values({
    doctorClinicId: clinicId,
    doctorId,
    dayOfWeek: day as never,
    startTime: "09:00",
    endTime: "17:00",
    sessionType: "full_day" as never,
    is24Hours: false,
    isActive: true,
  });
}

function setPatient(userId: number) {
  fixtureSession.setFixtureDoctor({
    id: userId,
    name: "Fixture patient",
    email: `patient-${userId}@fixture.test`,
    role: "patient",
  });
}

test("patient reschedules a future appointment to a valid new slot", async () => {
  await withCleanFixtures(async () => {
    const doctorId = await makeUser({ role: "doctor" });
    const patientId = await makeUser({ role: "patient" });
    setPatient(patientId);

    const clinicId = await makeClinic(doctorId);
    await makeSchedule(clinicId, doctorId, "monday");
    const monday = nextMonday();

    const appointmentId = await makeAppointment({
      doctorId,
      patientId,
      clinicId,
      date: monday,
      time: "10:00 AM",
      status: "confirmed",
    });

    const { reschedulePatientAppointment } = await loadActions();
    const res = await reschedulePatientAppointment(appointmentId, monday, "14:30");
    assert.equal(res.error, null);

    const [row] = await db
      .select({ date: appointments.date, time: appointments.time, status: appointments.status })
      .from(appointments)
      .where(eq(appointments.id, appointmentId));
    // The stored time is the legacy format the whole system uses.
    assert.equal(row.time, "2:30 PM");
    assert.equal(row.date, monday);
    assert.equal(row.status, "confirmed");
  });
});

test("reschedule refuses foreign, same-slot, off-schedule and conflicting targets", async () => {
  await withCleanFixtures(async () => {
    const doctorId = await makeUser({ role: "doctor" });
    const patientId = await makeUser({ role: "patient" });
    const otherPatientId = await makeUser({ role: "patient" });
    setPatient(patientId);

    const clinicId = await makeClinic(doctorId);
    await makeSchedule(clinicId, doctorId, "monday");
    const monday = nextMonday();

    const appointmentId = await makeAppointment({
      doctorId,
      patientId,
      clinicId,
      date: monday,
      time: "10:00 AM",
      status: "confirmed",
    });
    // Another patient holds the 11:00 slot with the same doctor.
    await makeAppointment({
      doctorId,
      patientId: otherPatientId,
      clinicId,
      date: monday,
      time: "11:00 AM",
      status: "confirmed",
    });

    const { reschedulePatientAppointment } = await loadActions();

    // Ownership: another patient's appointment is invisible.
    const foreignId = await makeAppointment({
      doctorId,
      patientId: otherPatientId,
      clinicId,
      date: monday,
      time: "12:00 PM",
      status: "confirmed",
    });
    const foreign = await reschedulePatientAppointment(foreignId, monday, "15:00");
    assert.match(foreign.error ?? "", /not found/);

    // No-op: the slot it already occupies.
    const sameSlot = await reschedulePatientAppointment(appointmentId, monday, "10:00");
    assert.match(sameSlot.error ?? "", /different date or time/);

    // Availability: 20:00 is outside the 09:00–17:00 schedule.
    const offSchedule = await reschedulePatientAppointment(appointmentId, monday, "20:00");
    assert.match(offSchedule.error ?? "", /outside the doctor's available schedule/);

    // Conflict: 11:00 is held by the other patient.
    const conflict = await reschedulePatientAppointment(appointmentId, monday, "11:00");
    assert.match(conflict.error ?? "", /already booked/);

    // None of the refused calls moved the appointment.
    const [row] = await db
      .select({ date: appointments.date, time: appointments.time })
      .from(appointments)
      .where(eq(appointments.id, appointmentId));
    assert.equal(row.date, monday);
    assert.equal(row.time, "10:00 AM");
  });
});

test("reschedule refuses cancelled and completed appointments", async () => {
  await withCleanFixtures(async () => {
    const doctorId = await makeUser({ role: "doctor" });
    const patientId = await makeUser({ role: "patient" });
    setPatient(patientId);

    const monday = nextMonday();
    const cancelledId = await makeAppointment({
      doctorId,
      patientId,
      date: monday,
      time: "10:00 AM",
      status: "cancelled",
    });
    const completedId = await makeAppointment({
      doctorId,
      patientId,
      date: monday,
      time: "11:00 AM",
      status: "completed",
    });

    const { reschedulePatientAppointment } = await loadActions();
    const cancelled = await reschedulePatientAppointment(cancelledId, monday, "15:00");
    assert.match(cancelled.error ?? "", /Cancelled appointments cannot be rescheduled/);
    const completed = await reschedulePatientAppointment(completedId, monday, "15:00");
    assert.match(completed.error ?? "", /Completed appointments cannot be rescheduled/);
  });
});
