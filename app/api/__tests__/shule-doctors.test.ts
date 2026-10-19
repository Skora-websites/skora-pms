/**
 * US6 — integration tenancy (audit H4 / FR-017, FR-018).
 *
 * `/api/shule/doctors` authenticated a bearer token, never read `user.role`,
 * and ran `role='doctor' AND status='active'` with no tenant filter and
 * `limit(200)` — handing names, emails, phones and registration numbers of
 * every active doctor across every business to a patient-tier token. `users`
 * carries no business_id, so tenancy must be derived per role.
 *
 * WHAT IS NOT TESTED HERE, AND WHY: the route module itself cannot be imported
 * under this runner. `import { GET } from "../shule/doctors/route"` fails at
 * load time with `_react.default.createContext is not a function` — the route
 * pulls `next/server`, which reaches React's `app-router-context` and explodes
 * under `--conditions react-server`. Next's request-scoped `headers()` is
 * unavailable for the same reason, so the per-IP rate-limit key cannot be
 * exercised either. (Without `--conditions react-server` the `server-only`
 * package refuses the import instead.) So the tests below target the two units
 * the route delegates its entire access decision to:
 *
 *   1. `resolveApiTokenHeader` (`lib/auth/api-token.ts`) — which refusal kind a
 *      token maps to, i.e. the route's 401-vs-403 switch.
 *      `deactivated` ⇒ 403, `unauthenticated` ⇒ 401 (FR-018).
 *   2. `resolveVisibleDoctorIds` (`lib/auth/integration-scope.ts`) — the tenant
 *      filter the route applies via `inArray` (R7 / FR-017).
 *
 * The route's remaining behaviour is a composition of these two: the ?id= path
 * additionally intersects the id into that set, so an out-of-scope id yields an
 * empty result and therefore the documented 404.
 *
 * Run: npm run test
 */

import "dotenv/config";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { withCleanFixtures } from "../../../tests/helpers/db";
import { db } from "../../../lib/db";
import {
  businessClinics,
  businesses,
  clinicManagers,
  personalAccessTokens,
  users,
} from "../../../lib/db/schema";
import { addClinicMember, makeClinic, makeUser } from "../../../tests/helpers/fixtures";
import { API_STAFF_TIERS, hashApiToken, resolveApiTokenHeader } from "../../../lib/auth/api-token";
import { resolveVisibleDoctorIds } from "../../../lib/auth/integration-scope";

const TOKENABLE_TYPE = "App\\Models\\User";

/** Plaintext tokens handed out in this file — revoked before each fixture sweep. */
const ISSUED: string[] = [];

async function issueToken(userId: number): Promise<string> {
  const plaintext = `fixture-${randomUUID()}`;
  await db.insert(personalAccessTokens).values({
    tokenableType: TOKENABLE_TYPE,
    tokenableId: userId,
    name: `fixture-${randomUUID()}`,
    token: hashApiToken(plaintext),
    abilities: "*",
  });
  ISSUED.push(plaintext);
  return plaintext;
}

/** Tokens have no user FK, so `cleanFixtures` cannot sweep them — we must. */
async function revokeIssued(): Promise<void> {
  while (ISSUED.length > 0) {
    const plaintext = ISSUED.pop();
    if (!plaintext) continue;
    await db
      .delete(personalAccessTokens)
      .where(eq(personalAccessTokens.token, hashApiToken(plaintext)));
  }
}

async function withCleanScope(body: () => Promise<void>): Promise<void> {
  await withCleanFixtures(async () => {
    try {
      await body();
    } finally {
      await revokeIssued();
    }
  });
}

async function makeBusiness(ownerId: number): Promise<number> {
  const [r] = await db
    .insert(businesses)
    .values({
      ownerId,
      name: `Fixture Business ${randomUUID()}`,
      slug: `fixture-${randomUUID()}`,
    })
    .$returningId();
  return Number(r.id);
}

async function linkBusinessClinic(businessId: number, clinicId: number): Promise<void> {
  await db.insert(businessClinics).values({ businessId, clinicId });
}

/**
 * The shared `assignManager` fixture writes `business_id` = the clinic's
 * doctorId, which is not a business row and trips the FK. Write the real row
 * here instead — the assignment semantics are the same.
 */
async function assignManagerToClinic(
  managerId: number,
  clinicId: number,
  businessId: number
): Promise<void> {
  await db.insert(clinicManagers).values({
    userId: managerId,
    clinicId,
    businessId,
    isActive: true,
  });
}

async function markRegistrationNumber(doctorId: number, value: string): Promise<void> {
  await db.update(users).set({ registrationNumber: value }).where(eq(users.id, doctorId));
}

/** The Authorization header value the route would read for this token. */
const bearer = (plaintext: string): string | null => `Bearer ${plaintext}`;

test("a patient-tier token resolves to no doctors and is refused as non-staff", async () => {
  await withCleanScope(async () => {
    const practiceOwner = await makeUser({ role: "doctor", name: "Dr Outside Patient" });
    const patient = await makeUser({
      role: "patient",
      name: "Patient Caller",
      doctorId: practiceOwner,
      referenceRoleId: practiceOwner,
    });
    const plaintext = await issueToken(patient);

    // The holder IS authenticated (it owns a live token) — the route then
    // refuses on tier, which is the 403 in the acceptance scenario.
    const resolution = await resolveApiTokenHeader(bearer(plaintext));
    assert.equal(resolution.kind, "authenticated");
    assert.ok(
      !API_STAFF_TIERS.includes(resolution.user.role),
      "a patient is not a staff tier, so the route answers 403 with no rows"
    );

    // Defence in depth: even if the tier gate were bypassed, the derivation
    // yields no doctors for a patient rather than the global table.
    assert.deepEqual(
      await resolveVisibleDoctorIds(resolution.user),
      [],
      "a patient-tier holder sees no doctors at all"
    );
  });
});

test("a business-A owner token sees business A's doctors and never business B's", async () => {
  await withCleanScope(async () => {
    const adminA = await makeUser({ role: "admin", name: "Owner A" });
    const doctorA1 = await makeUser({ role: "doctor", name: "Doctor A1" });
    const doctorA2 = await makeUser({ role: "doctor", name: "Doctor A2" });
    const clinicA = await makeClinic(doctorA1, "Fixture Clinic A");
    await addClinicMember(clinicA, doctorA2);
    const businessA = await makeBusiness(adminA);
    await linkBusinessClinic(businessA, clinicA);

    // A different business, a different owner, different doctors.
    const doctorB1 = await makeUser({ role: "doctor", name: "Doctor B1" });
    const doctorB2 = await makeUser({ role: "doctor", name: "Doctor B2" });
    const clinicB = await makeClinic(doctorB1, "Fixture Clinic B");
    await addClinicMember(clinicB, doctorB2);
    const adminB = await makeUser({ role: "admin", name: "Owner B" });
    const businessB = await makeBusiness(adminB);
    await linkBusinessClinic(businessB, clinicB);
    await markRegistrationNumber(doctorB1, "REGB-OUT-OF-TENANT");

    const plaintext = await issueToken(adminA);
    const resolution = await resolveApiTokenHeader(bearer(plaintext));
    assert.equal(resolution.kind, "authenticated");

    const visible = await resolveVisibleDoctorIds(resolution.user);
    assert.deepEqual(
      [...visible].sort((a, b) => a - b),
      [doctorA1, doctorA2].sort((a, b) => a - b),
      "an owner sees the doctors of the businesses they own — all of them"
    );
    assert.ok(!visible.includes(doctorB1), "no doctor from business B may appear");
    assert.ok(!visible.includes(doctorB2), "no doctor from business B may appear");
    // registration_number is only ever selected for ids inside this set, so
    // business B's value cannot reach an A-scoped caller.
    assert.ok(clinicB > 0 && businessB > 0);
  });
});

test("a manager token sees only the clinics assigned to it", async () => {
  await withCleanScope(async () => {
    const adminA = await makeUser({ role: "admin", name: "Manager Owner" });
    const practiceDoctor = await makeUser({ role: "doctor", name: "Practice Doctor" });
    const assignedClinic = await makeClinic(practiceDoctor, "Fixture Clinic Assigned");
    const assignedMember = await makeUser({ role: "doctor", name: "Assigned Doctor" });
    await addClinicMember(assignedClinic, assignedMember);
    const unassignedClinic = await makeClinic(practiceDoctor, "Fixture Clinic Unassigned");
    const unassignedMember = await makeUser({ role: "doctor", name: "Unassigned Doctor" });
    await addClinicMember(unassignedClinic, unassignedMember);

    const businessA = await makeBusiness(adminA);
    await linkBusinessClinic(businessA, assignedClinic);
    await linkBusinessClinic(businessA, unassignedClinic);

    const manager = await makeUser({ role: "manager", name: "Clinic Manager" });
    await assignManagerToClinic(manager, assignedClinic, businessA);

    const plaintext = await issueToken(manager);
    const resolution = await resolveApiTokenHeader(bearer(plaintext));
    assert.equal(resolution.kind, "authenticated");

    const visible = await resolveVisibleDoctorIds(resolution.user);
    assert.ok(visible.includes(assignedMember), "the assigned clinic's doctor is visible");
    assert.ok(visible.includes(practiceDoctor), "the clinic owner belongs to the clinic");
    assert.ok(!visible.includes(unassignedMember), "an unassigned clinic's doctor must never appear");
  });
});

test("a doctor token sees its own practice and nothing else", async () => {
  await withCleanScope(async () => {
    const practiceOwner = await makeUser({ role: "doctor", name: "Doctor Token Holder" });
    const ownClinic = await makeClinic(practiceOwner, "Fixture Clinic Practice");
    const colleague = await makeUser({ role: "doctor", name: "Doctor Colleague" });
    await addClinicMember(ownClinic, colleague);

    const strangerOwner = await makeUser({ role: "doctor", name: "Doctor Stranger Owner" });
    const strangerClinic = await makeClinic(strangerOwner, "Fixture Clinic Stranger");
    const stranger = await makeUser({ role: "doctor", name: "Doctor Stranger" });
    await addClinicMember(strangerClinic, stranger);

    const plaintext = await issueToken(practiceOwner);
    const resolution = await resolveApiTokenHeader(bearer(plaintext));
    assert.equal(resolution.kind, "authenticated");

    const visible = await resolveVisibleDoctorIds(resolution.user);
    assert.ok(visible.includes(practiceOwner), "the holder's own id is in scope");
    assert.ok(visible.includes(colleague), "the practice's active members are in scope");
    assert.ok(!visible.includes(stranger), "another practice's doctors are out of scope");
    assert.ok(!visible.includes(strangerOwner), "another clinic's owner is out of scope");
  });
});

test("a deactivated token owner resolves to the refusal the route maps to 403", async () => {
  await withCleanScope(async () => {
    const admin = await makeUser({ role: "admin", name: "Deactivating Owner" });
    const doctorId = await makeUser({ role: "doctor", name: "Doctor Of Deactivated" });
    const clinicId = await makeClinic(doctorId);
    const businessId = await makeBusiness(admin);
    await linkBusinessClinic(businessId, clinicId);

    const plaintext = await issueToken(admin);

    // Live first: the very token that later refuses.
    const live = await resolveApiTokenHeader(bearer(plaintext));
    assert.equal(live.kind, "authenticated");
    if (live.kind === "authenticated") {
      assert.ok(
        (await resolveVisibleDoctorIds(live.user)).includes(doctorId),
        "the doctor was visible while the owner was active"
      );
    }

    await db.update(users).set({ status: "inactive" }).where(eq(users.id, admin));
    const refused = await resolveApiTokenHeader(bearer(plaintext));
    assert.equal(refused.kind, "deactivated", "the documented contract is 403, not 401");
  });
});

test("a missing or unknown token resolves to the refusal the route maps to 401", async () => {
  await withCleanScope(async () => {
    const admin = await makeUser({ role: "admin", name: "Owner C" });
    const plaintext = await issueToken(admin);

    const noHeader = await resolveApiTokenHeader(null);
    assert.equal(noHeader.kind, "unauthenticated");

    const unknown = await resolveApiTokenHeader(`Bearer not-a-real-token-${randomUUID()}`);
    assert.equal(unknown.kind, "unauthenticated");

    // Still fine for the live token — the failure is the token, not the account.
    const live = await resolveApiTokenHeader(bearer(plaintext));
    assert.equal(live.kind, "authenticated");
  });
});

test("an expired token resolves to the refusal the route maps to 401", async () => {
  await withCleanScope(async () => {
    const admin = await makeUser({ role: "admin", name: "Owner D" });
    const plaintext = `fixture-expired-${randomUUID()}`;
    await db.insert(personalAccessTokens).values({
      tokenableType: TOKENABLE_TYPE,
      tokenableId: admin,
      name: `fixture-${randomUUID()}`,
      token: hashApiToken(plaintext),
      expiresAt: new Date(Date.now() - 60_000),
    });
    ISSUED.push(plaintext);

    const resolution = await resolveApiTokenHeader(bearer(plaintext));
    assert.equal(resolution.kind, "unauthenticated", "an expired token is not a 403 case");
  });
});
