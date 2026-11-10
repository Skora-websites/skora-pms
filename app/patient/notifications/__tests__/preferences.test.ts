/**
 * Patient notification preferences (§7.2.4 — per-channel prefs in one place).
 *
 * The REAL action module is driven with the session reader stubbed to a
 * fixture patient (tests/helpers/doctor-session-stub.ts, role-agnostic).
 * What is under test:
 *
 *  1. defaults: a patient with no stored prefs reads back all-"allowed";
 *  2. an update persists exactly the submitted boxes (missing checkbox ⇒
 *     off) and `wantsNotification` AGREES with the stored shape — the whole
 *     point of the feature is that senders obey it;
 *  3. scoping: updating never touches another patient's stored prefs;
 *  4. a non-patient caller gets an error and no write.
 *
 * Run: npm test (needs the live MySQL — same as the other fixture suites).
 */

import "dotenv/config";

import { test } from "node:test";
import assert from "node:assert/strict";
import * as nodeModule from "node:module";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { withCleanFixtures } from "../../../../tests/helpers/db";
import { makeUser } from "../../../../tests/helpers/fixtures";
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
let notifModule: typeof import("@/lib/notifications") | undefined;
async function loadActions() {
  actions ??= (await import("../actions")) as typeof import("../actions");
  notifModule ??= (await import("@/lib/notifications")) as typeof import("@/lib/notifications");
  return actions;
}

function setPatient(id: number, email = `patient-${id}@fixture.test`) {
  fixtureSession.setFixtureDoctor({
    id,
    name: "Fixture patient",
    email,
    role: "patient",
  });
}

function setDoctor(id: number, email = `doctor-${id}@fixture.test`) {
  fixtureSession.setFixtureDoctor({
    id,
    name: "Fixture doctor",
    email,
    role: "doctor",
  });
}

/** FormData with only the named boxes checked. */
function formOf(checked: string[]): FormData {
  const form = new FormData();
  for (const key of checked) form.append(key, "on");
  return form;
}

test("patients with no stored preferences read back all-allowed", async () => {
  await withCleanFixtures(async () => {
    setPatient(await makeUser({ role: "patient" }));
    const { getPatientNotificationPreferences } = await loadActions();

    const prefs = await getPatientNotificationPreferences();
    assert.deepEqual(prefs, {
      appointment_booking: { email: true, in_app: true },
      appointment_cancellation: { email: true, in_app: true },
    });
  });
});

test("an update persists exactly the submitted boxes and senders obey it", async () => {
  await withCleanFixtures(async () => {
    const patientId = await makeUser({ role: "patient" });
    setPatient(patientId);
    const { getPatientNotificationPreferences, updatePatientNotificationPreferences } =
      await loadActions();

    // Only booking-in-app stays on: email-for-booking, both cancellation
    // channels off. The action is a form action → (prevState, formData).
    const res = await updatePatientNotificationPreferences(
      { error: null, success: false },
      formOf(["appointment_booking_in_app"])
    );
    assert.equal(res.error, null);
    assert.equal(res.success, true);

    const stored = await getPatientNotificationPreferences();
    assert.deepEqual(stored, {
      appointment_booking: { email: false, in_app: true },
      appointment_cancellation: { email: false, in_app: false },
    });

    // The actual reason this exists: senders must obey the stored shape.
    const { wantsNotification } = notifModule!;
    assert.equal(await wantsNotification(patientId, "in_app", "appointment_booking"), true);
    assert.equal(await wantsNotification(patientId, "email", "appointment_booking"), false);
    assert.equal(
      await wantsNotification(patientId, "email", "appointment_cancellation"),
      false
    );
  });
});

test("updating never touches another patient's preferences", async () => {
  await withCleanFixtures(async () => {
    const patientId = await makeUser({ role: "patient" });
    const otherId = await makeUser({ role: "patient" });
    // A pre-existing foreign shape distinct from the defaults.
    await db
      .update(users)
      .set({
        notificationPreferences: {
          appointment_booking: { email: false, in_app: false, sms: false },
        },
      })
      .where(eq(users.id, otherId));
    setPatient(patientId);
    const { updatePatientNotificationPreferences, getPatientNotificationPreferences } =
      await loadActions();

    const res = await updatePatientNotificationPreferences(
      { error: null, success: false },
      formOf([])
    );
    assert.equal(res.error, null);

    // The caller went all-off…
    const caller = await getPatientNotificationPreferences();
    assert.deepEqual(caller, {
      appointment_booking: { email: false, in_app: false },
      appointment_cancellation: { email: false, in_app: false },
    });

    // …and the foreign row kept its original shape, untouched.
    const [foreign] = await db
      .select({ prefs: users.notificationPreferences })
      .from(users)
      .where(eq(users.id, otherId));
    assert.deepEqual(foreign.prefs, {
      appointment_booking: { email: false, in_app: false, sms: false },
    });
  });
});

test("a non-patient caller cannot read or write patient preferences", async () => {
  await withCleanFixtures(async () => {
    setDoctor(await makeUser({ role: "doctor" }));
    const { getPatientNotificationPreferences, updatePatientNotificationPreferences } =
      await loadActions();

    assert.equal(await getPatientNotificationPreferences(), null);
    const res = await updatePatientNotificationPreferences(
      { error: null, success: false },
      formOf(["appointment_booking_email"])
    );
    assert.match(res.error ?? "", /authorised/i);
  });
});
