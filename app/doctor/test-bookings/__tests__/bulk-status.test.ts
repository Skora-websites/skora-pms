/**
 * `bulkUpdateTestBookingStatus` — the bulk write behind the multi-select bar
 * (audit UX §7.2.3).
 *
 * The REAL action module is driven, with the session reader stubbed to a
 * fixture doctor (see tests/helpers/doctor-session-stub.ts — same pattern as
 * lib/dispatch/__tests__/tier.test.ts). What is under test:
 *
 *  1. the business state machine holds in bulk: a mixed selection updates
 *     only the eligible subset and reports skipped counts;
 *  2. scoping: another practice's booking ids are invisible — never updated;
 *  3. an invalid status is refused before any write;
 *  4. an empty/degenerate id list is refused.
 *
 * Run: npm test (needs the live MySQL — same as the other fixture suites).
 */

import "dotenv/config";

import { test } from "node:test";
import assert from "node:assert/strict";
import * as nodeModule from "node:module";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  testBookings,
  vendors,
  permissions,
  modelHasPermissions,
} from "@/lib/db/schema";
import { withCleanFixtures } from "../../../../tests/helpers/db";
import { makeUser, makePatient } from "../../../../tests/helpers/fixtures";
import * as doctorSession from "../../../../tests/helpers/doctor-session-stub";

/** Local unique label (fixtures.ts keeps its own private). */
let seq = 0;
const uid = (label: string) => `${label}-${process.pid}-${++seq}`;

const SPECIFIER_STUBS: Record<string, string> = {
  "next/navigation": "../../../../tests/helpers/next-stubs.ts",
  "next/cache": "../../../../tests/helpers/next-stubs.ts",
  "next/headers": "../../../../tests/helpers/next-stubs.ts",
  // The session module itself is matched by RESOLVED PATH in the hook below
  // (the actions import it both as the alias and as the relative "./user").
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
    // (alias, as in the dispatch actions) and `./user` (relative, as in
    // lib/auth/action-scope.ts). Matching by RESOLVED path covers both: let
    // the chain resolve the specifier, then swap in the stub when it lands on
    // the real session module.
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

/** Grant `test-booking-edit` to the fixture doctor (real permission path). */
async function grantTestBookingEdit(userId: number) {
  const name = "test-booking-edit";
  let [perm] = await db
    .select({ id: permissions.id })
    .from(permissions)
    .where(eq(permissions.name, name))
    .limit(1);
  if (!perm) {
    [perm] = await db
      .insert(permissions)
      .values({ name, guardName: "web" })
      .$returningId();
  }
  await db
    .insert(modelHasPermissions)
    .values({ permissionId: perm.id, modelId: userId, modelType: "App\\Models\\User" })
    .onDuplicateKeyUpdate({ set: { modelId: userId } });
}

async function makeBooking(doctorId: number, patientId: number, vendorId: number, status: string) {
  const [r] = await db
    .insert(testBookings)
    .values({
      doctorId,
      patientId,
      vendorId,
      status: status as never,
      tests: [{ name: "CBC" }],
      totalAmount: "500",
    })
    .$returningId();
  return Number(r.id);
}

test("bulk status update updates only the eligible subset and reports skips", async () => {
  await withCleanFixtures(async () => {
    const doctorId = await makeUser({ role: "doctor" });
    doctorSession.setFixtureDoctor({
      id: doctorId,
      name: "Fixture doctor",
      email: `doctor-${doctorId}@fixture.test`,
      role: "doctor",
    });
    await grantTestBookingEdit(doctorId);

    const patientId = await makePatient(doctorId);
    const [vendor] = await db
      .insert(vendors)
      .values({
        doctorId,
        name: `Fixture vendor ${uid("vendor")}`,
        mobile: "9000000000",
        email: `vendor-${uid("v")}@fixture.test`,
        address: "Fixture address",
      })
      .$returningId();
    const vendorId = Number(vendor.id);

    const pendingId = await makeBooking(doctorId, patientId, vendorId, "pending");
    const inProgressId = await makeBooking(doctorId, patientId, vendorId, "in-progress");
    const completedId = await makeBooking(doctorId, patientId, vendorId, "completed");

    const { bulkUpdateTestBookingStatus } = await loadActions();
    const res = await bulkUpdateTestBookingStatus(
      [pendingId, inProgressId, completedId],
      "cancelled"
    );

    assert.equal(res.error, null);
    // pending → cancelled and in-progress → cancelled are legal;
    // completed is terminal, so it must be skipped, not overridden.
    assert.equal(res.updated, 2);
    assert.equal(res.skipped, 1);

    const after = await db
      .select({ id: testBookings.id, status: testBookings.status })
      .from(testBookings)
      .where(inArray(testBookings.id, [pendingId, inProgressId, completedId]));
    const statusById = new Map(after.map((r) => [r.id, r.status]));
    assert.equal(statusById.get(pendingId), "cancelled");
    assert.equal(statusById.get(inProgressId), "cancelled");
    assert.equal(statusById.get(completedId), "completed");
  });
});

test("bulk status update never touches another practice's bookings", async () => {
  await withCleanFixtures(async () => {
    const doctorId = await makeUser({ role: "doctor" });
    const otherDoctorId = await makeUser({ role: "doctor" });
    doctorSession.setFixtureDoctor({
      id: doctorId,
      name: "Fixture doctor",
      email: `doctor-${doctorId}@fixture.test`,
      role: "doctor",
    });
    await grantTestBookingEdit(doctorId);

    const patientId = await makePatient(doctorId);
    const otherPatientId = await makePatient(otherDoctorId);
    const [vendor] = await db
      .insert(vendors)
      .values({
        doctorId,
        name: `Fixture vendor ${uid("vendor")}`,
        mobile: "9000000000",
        email: `vendor-${uid("v")}@fixture.test`,
        address: "Fixture address",
      })
      .$returningId();
    const vendorId = Number(vendor.id);

    const mineId = await makeBooking(doctorId, patientId, vendorId, "pending");
    const foreignId = await makeBooking(otherDoctorId, otherPatientId, vendorId, "pending");

    const { bulkUpdateTestBookingStatus } = await loadActions();
    const res = await bulkUpdateTestBookingStatus([mineId, foreignId], "completed");

    assert.equal(res.error, null);
    assert.equal(res.updated, 1);
    // The foreign id is invisible to this doctor — it is reported as skipped,
    // never written (the 404-equivalent philosophy, in bulk form).
    assert.equal(res.skipped, 1);

    const [foreign] = await db
      .select({ status: testBookings.status })
      .from(testBookings)
      .where(eq(testBookings.id, foreignId));
    assert.equal(foreign.status, "pending");
  });
});

test("bulk status update refuses an invalid status and a degenerate id list", async () => {
  await withCleanFixtures(async () => {
    const doctorId = await makeUser({ role: "doctor" });
    doctorSession.setFixtureDoctor({
      id: doctorId,
      name: "Fixture doctor",
      email: `doctor-${doctorId}@fixture.test`,
      role: "doctor",
    });
    await grantTestBookingEdit(doctorId);

    const patientId = await makePatient(doctorId);
    const [vendor] = await db
      .insert(vendors)
      .values({
        doctorId,
        name: `Fixture vendor ${uid("vendor")}`,
        mobile: "9000000000",
        email: `vendor-${uid("v")}@fixture.test`,
        address: "Fixture address",
      })
      .$returningId();
    const vendorId = Number(vendor.id);
    const bookingId = await makeBooking(doctorId, patientId, vendorId, "pending");

    const { bulkUpdateTestBookingStatus } = await loadActions();

    const badStatus = await bulkUpdateTestBookingStatus([bookingId], "shipped");
    assert.match(badStatus.error ?? "", /Invalid status/);

    const emptyIds = await bulkUpdateTestBookingStatus([], "completed");
    assert.match(emptyIds.error ?? "", /No bookings selected/);

    const junkIds = await bulkUpdateTestBookingStatus([0, -3, 1.5], "completed");
    assert.match(junkIds.error ?? "", /No bookings selected/);

    // Nothing was written by any of the refused calls.
    const [row] = await db
      .select({ status: testBookings.status })
      .from(testBookings)
      .where(eq(testBookings.id, bookingId));
    assert.equal(row.status, "pending");
  });
});
