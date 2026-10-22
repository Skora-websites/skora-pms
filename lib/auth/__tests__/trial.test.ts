/**
 * Trial-access rules — the predicate every guard (doctor layout, API
 * permission guards, server actions) calls to decide whether a doctor still
 * has working access. `users.trial_ends_at` is also the paid-access expiry
 * (package fulfillment extends it), so these boundaries decide whether a
 * paying or trialling doctor keeps access. Asserted here rather than
 * re-derived per guard.
 *
 * Run: npm run test
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DAY_MS,
  DEFAULT_TRIAL_DAYS,
  isTrialExpired,
  msUntilTrialEnd,
  trialEndsInDays,
} from "../trial";

/** Fixed instant for the pure `trialEndsInDays` math only. */
const NOW = Date.UTC(2026, 0, 15, 12, 0, 0);
/** Real relative offsets — isTrialExpired reads the wall clock, not NOW. */
const past = new Date(Date.now() - DAY_MS);
const future = new Date(Date.now() + DAY_MS);

test("a doctor with no trial date is never expired (seeded/legacy accounts)", () => {
  assert.equal(isTrialExpired({ role: "doctor", trialEndsAt: null }), false);
  assert.equal(isTrialExpired({ role: "doctor", trialEndsAt: undefined }), false);
});

test("a doctor inside the window keeps access", () => {
  assert.equal(isTrialExpired({ role: "doctor", trialEndsAt: future }), false);
});

test("a doctor past the window is expired", () => {
  assert.equal(isTrialExpired({ role: "doctor", trialEndsAt: past }), true);
});

test("expiry is inclusive: the exact end instant is expired", () => {
  const now = Date.now();
  assert.equal(isTrialExpired({ role: "doctor", trialEndsAt: new Date(now) }), true);
});

test("only the doctor role carries a trial — staff tiers never expire", () => {
  for (const role of ["super_admin", "admin", "manager", "receptionist", "patient"]) {
    assert.equal(
      isTrialExpired({ role, trialEndsAt: past }),
      false,
      `${role} must not be trial-bound`,
    );
  }
});

test("an ISO string date is accepted (rows serialized across the API)", () => {
  assert.equal(isTrialExpired({ role: "doctor", trialEndsAt: past.toISOString() }), true);
  assert.equal(isTrialExpired({ role: "doctor", trialEndsAt: future.toISOString() }), false);
});

test("a package-extended expiry keeps access until the new window ends", () => {
  // Fulfillment sets trialEndsAt to max(current, now) + plan.days — an
  // extended window must read as live access, not an expired trial.
  const extended = trialEndsInDays(30, past.getTime());
  assert.equal(isTrialExpired({ role: "doctor", trialEndsAt: extended }), false);
});

test("trialEndsInDays lands exactly N days out", () => {
  assert.equal(trialEndsInDays(DEFAULT_TRIAL_DAYS, NOW).getTime(), NOW + DEFAULT_TRIAL_DAYS * DAY_MS);
  assert.equal(trialEndsInDays(1, NOW).getTime(), NOW + DAY_MS);
});

test("trialEndsInDays rejects non-positive or non-numeric day counts", () => {
  for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => trialEndsInDays(bad, NOW), RangeError);
  }
});

test("msUntilTrialEnd clamps at zero and ignores non-doctors", () => {
  // Real wall clock: `future` is now + exactly one day (± module-load latency).
  const realNow = Date.now();
  const remaining = msUntilTrialEnd({ role: "doctor", trialEndsAt: future }, realNow);
  assert.ok(remaining > 0 && remaining <= DAY_MS, `expected 0 < remaining <= ${DAY_MS}, got ${remaining}`);
  assert.equal(msUntilTrialEnd({ role: "doctor", trialEndsAt: past }, realNow), 0);
  assert.equal(msUntilTrialEnd({ role: "receptionist", trialEndsAt: future }, realNow), 0);
  assert.equal(msUntilTrialEnd({ role: "doctor", trialEndsAt: null }, realNow), 0);
});
