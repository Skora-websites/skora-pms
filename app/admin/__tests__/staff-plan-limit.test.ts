/**
 * Owner-tier package entitlements — the hole the doctor tier closed first.
 *
 * commit 5705e9a enforced the plan seat limit on /doctor/staff. The owner
 * panel (/admin/staff, /admin/managers) creates the same receptionist and
 * manager accounts but resolved no plan at all, so a Package 1 owner (one
 * seat) could add unlimited staff from the Business dashboard. This suite
 * drives the REAL server action — not a re-implementation — through a forged
 * but genuine session, the same harness pattern lib/dispatch/__tests__/tier
 * .test.ts established for `"use server"` modules:
 *
 *  - `module.registerHooks` redirects next/navigation, next/cache and
 *    next/headers so the action module loads under the react-server condition
 *    the app's DB layer requires;
 *  - the session is minted through lib/auth/session itself (sign + persist a
 *    real JWT for a fixture owner), so cookie verification, the revocation
 *    row, requireAdminPermission and getBusinessScope all run as production.
 *
 * Run: npm run test
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import * as nodeModule from "node:module";
import { randomUUID } from "node:crypto";
import { withCleanFixtures } from "../../../tests/helpers/db";
import { db } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { setSessionToken } from "../../../tests/helpers/request-scope-stub";
import {
  linkBusinessClinic,
  makeBusiness,
  makeClinic,
  makeUser,
} from "../../../tests/helpers/fixtures";
import type * as StaffActionsModule from "../staff/actions";
import type * as ManagerActionsModule from "../managers/actions";

type StaffActions = typeof StaffActionsModule;
type ManagerActions = typeof ManagerActionsModule;

/** Specifiers redirected so the action module can load (see the header). */
const SPECIFIER_STUBS: Record<string, string> = {
  "next/navigation": "../../../tests/helpers/next-stubs.ts",
  "next/cache": "../../../tests/helpers/next-stubs.ts",
  "next/headers": "../../../tests/helpers/request-scope-stub.ts",
};

const STUB_URLS = Object.values(SPECIFIER_STUBS).map((relative) => new URL(relative, import.meta.url).href);

type ResolveHook = (
  specifier: string,
  context: unknown,
  nextResolve: (specifier: string, context: unknown) => { url: string }
) => { url: string };

type ModuleWithHooks = {
  registerHooks: (hooks: { resolve: ResolveHook }) => void;
};

const moduleWithHooks = nodeModule as unknown as ModuleWithHooks;

moduleWithHooks.registerHooks({
  resolve(specifier, context, nextResolve) {
    const stubIndex = Object.keys(SPECIFIER_STUBS).indexOf(specifier);
    if (stubIndex !== -1) {
      return { url: STUB_URLS[stubIndex], shortCircuit: true };
    }
    return { url: nextResolve(specifier, context).url, shortCircuit: true };
  },
});

let cached: StaffActions | undefined;
let cachedManagers: ManagerActions | undefined;

/**
 * Import the action modules once.
 *
 * EXCEPTION (dynamic import): a static import is hoisted above
 * `registerHooks`, so the real `next/headers` would bind first and every
 * action would read a session from outside a request scope (this is exactly
 * how the first run failed: a silent redirect to /login).
 */
async function staffActions(): Promise<StaffActions> {
  cached ??= await import("../staff/actions");
  return cached;
}

async function managerActionsModule(): Promise<ManagerActions> {
  cachedManagers ??= await import("../managers/actions");
  return cachedManagers;
}

/**
 * Sign in as `userId` by minting + persisting a real session JWT.
 *
 * Dynamic import: lib/auth/session must resolve `next/headers` through the
 * stub above, and a static import would be hoisted above registerHooks and
 * bind the real module instead (that is why the first run redirected to
 * /login: the real cookies() threw outside a request scope and the session
 * resolved to null).
 *
 * Returns the jti so the suite can drop the row it created — the fixture
 * sweep deletes users, not their sessions.
 */
async function signInAs(userId: number): Promise<string> {
  const { signSessionToken, persistSession } = await import("@/lib/auth/session");
  const jti = randomUUID();
  const token = await signSessionToken(userId, jti);
  await persistSession(userId, jti);
  setSessionToken(token);
  return jti;
}

/** Drop the session row a minted token created. */
async function dropSession(jti: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, jti));
}

/** Put the practice anchor doctor on a package with a future expiry. */
async function setPlan(doctorId: number, packageId: string): Promise<void> {
  await db
    .update(users)
    .set({ packageId, trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) })
    .where(eq(users.id, doctorId));
}

/** The create-manager form, as the owner panel submits it. */
function managerForm(email: string): FormData {
  const fd = new FormData();
  fd.set("name", "Seat Test Manager");
  fd.set("email", email);
  fd.set("phone", "9000000008");
  fd.set("password", "Smoke#Pass123");
  return fd;
}

/** The add-receptionist form, as the owner panel submits it. */
function staffForm(email: string, clinicId: number): FormData {
  const fd = new FormData();
  fd.set("clinic_id", String(clinicId));
  fd.set("name", "Seat Test Receptionist");
  fd.set("email", email);
  fd.set("phone", "9000000009");
  fd.set("password", "Smoke#Pass123");
  return fd;
}

test("an owner on a one-seat plan cannot add a receptionist from /admin/staff", async () => {
  await withCleanFixtures(async () => {
    let jti: string | undefined;
    try {
      const anchor = await makeUser({ role: "doctor" });
      const clinicId = await makeClinic(anchor, "Fixture Clinic For Seats");
      const owner = await makeUser({ role: "admin" });
      const businessId = await makeBusiness(owner, "Fixture Business For Seats");
      await linkBusinessClinic(businessId, clinicId);

      // The one seat is already taken.
      await makeUser({ role: "receptionist", doctorId: anchor, referenceRoleId: anchor });
      await setPlan(anchor, "package-1");
      jti = await signInAs(owner);

      const actions = await staffActions();
      const blocked = await actions.createStaffMember({ error: null }, staffForm("first.extra@fixture.test", clinicId));
      assert.ok(blocked.error, "a filled one-seat plan must refuse the addition");
      assert.match(blocked.error!, /1 staff account and all are in use/);

      // And the seat was not created behind the refusal.
      const [created] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, "first.extra@fixture.test"))
        .limit(1);
      assert.equal(created, undefined, "no receptionist row exists for the refused email");

      // Upgrading the plan opens the seat again — the same action succeeds.
      await setPlan(anchor, "package-3");
      const opened = await actions.createStaffMember({ error: null }, staffForm("second.extra@fixture.test", clinicId));
      assert.equal(opened.error, null, "a 5-seat plan admits the addition");
    } finally {
      setSessionToken(null);
      if (jti) await dropSession(jti);
    }
  });
});

test("a manager creation counts seats across the whole business, against the anchor doctor's plan", async () => {
  await withCleanFixtures(async () => {
    let jti: string | undefined;
    try {
      // Two practices under one business; the anchor is the anchor doctor's
      // row (the same scope.doctorIds[0] the app's writes and checkout use).
      const anchorDoctor = await makeUser({ role: "doctor" });
      const clinicAId = await makeClinic(anchorDoctor, "Fixture Clinic A");
      const doctorB = await makeUser({ role: "doctor" });
      const clinicBId = await makeClinic(doctorB, "Fixture Clinic B");
      const owner = await makeUser({ role: "admin" });
      const businessId = await makeBusiness(owner, "Fixture Business For Managers");
      await linkBusinessClinic(businessId, clinicAId);
      await linkBusinessClinic(businessId, clinicBId);

      const managerActions = await managerActionsModule();
      jti = await signInAs(owner);

      // One seat used at the SECOND doctor's practice — a per-doctor count
      // anchored at clinic A would miss it entirely.
      await makeUser({ role: "manager", referenceRoleId: doctorB, doctorId: doctorB });

      // The anchor doctor is on a three-seat plan.
      await setPlan(anchorDoctor, "package-2");
      const created = await managerActions.createManager({ error: null }, managerForm("first.manager@fixture.test"));
      assert.equal(created.error, null, "3 seats, 1 used across the business — the manager is admitted");

      // Filling the plan to its limit refuses the next manager.
      await setPlan(anchorDoctor, "package-1");
      const blocked = await managerActions.createManager({ error: null }, managerForm("second.manager@fixture.test"));
      assert.ok(blocked.error, "a filled one-seat plan refuses the addition");
      assert.match(blocked.error!, /1 staff account and all are in use/);
    } finally {
      setSessionToken(null);
      if (jti) await dropSession(jti);
    }
  });
});
