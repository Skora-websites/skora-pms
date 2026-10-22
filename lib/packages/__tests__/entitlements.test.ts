/**
 * Entitlement rules — these decide whether a paying doctor can add a staff
 * account, manage roles, or manage lab vendors, so both directions are pinned:
 * unrestricted access for trials/staff/legacy, and strict per-plan limits
 * matching the seeded pricing matrix.
 *
 * Run: npm run test
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  featureAllowed,
  featureBlockedMessage,
  resolveEntitlements,
  seatLimitMessage,
  seatLimitReached,
  seatsRemaining,
} from "../entitlements";

const TRIAL = { role: "doctor", packageId: null };
const P1 = { role: "doctor", packageId: "package-1" };
const P2 = { role: "doctor", packageId: "package-2" };
const P3 = { role: "doctor", packageId: "package-3" };

test("a doctor on trial keeps full access (no package id yet)", () => {
  const e = resolveEntitlements(TRIAL);
  assert.equal(e.packageId, null);
  assert.equal(e.staffSeats, null);
  assert.equal(seatLimitReached(e, 99), false);
  assert.equal(featureAllowed(e, "roleManagement"), true);
  assert.equal(featureAllowed(e, "multiVendorLabTests"), true);
});

test("staff and admin tiers are never restricted by a plan", () => {
  for (const role of ["receptionist", "admin", "manager", "super_admin", "patient"]) {
    const e = resolveEntitlements({ role, packageId: "package-1" });
    assert.equal(e.staffSeats, null, `${role} must not inherit a seat limit`);
    assert.equal(featureAllowed(e, "roleManagement"), true, `${role} must not be feature-gated`);
    assert.equal(featureAllowed(e, "multiVendorLabTests"), true);
  }
});

test("an unknown package id fails open rather than locking a buyer out", () => {
  const e = resolveEntitlements({ role: "doctor", packageId: "package-legacy-typo" });
  assert.equal(e.packageId, null);
  assert.equal(e.staffSeats, null);
  assert.equal(featureAllowed(e, "roleManagement"), true);
});

test("Package 1 is the seat-limited, feature-restricted tier", () => {
  const e = resolveEntitlements(P1);
  assert.equal(e.staffSeats, 1);
  assert.equal(featureAllowed(e, "roleManagement"), false);
  assert.equal(featureAllowed(e, "multiVendorLabTests"), false);
});

test("Packages 2 and 3 unlock roles and multi-vendor within their seats", () => {
  for (const user of [P2, P3]) {
    const e = resolveEntitlements(user);
    assert.equal(featureAllowed(e, "roleManagement"), true);
    assert.equal(featureAllowed(e, "multiVendorLabTests"), true);
  }
  assert.equal(resolveEntitlements(P2).staffSeats, 3);
  assert.equal(resolveEntitlements(P3).staffSeats, 5);
});

test("seat counting allows up to the limit and blocks beyond it", () => {
  const e = resolveEntitlements(P2);
  assert.equal(seatsRemaining(e, 0), 3);
  assert.equal(seatsRemaining(e, 3), 0);
  assert.equal(seatsRemaining(e, 5), 0, "never negative");
  assert.equal(seatLimitReached(e, 2), false);
  assert.equal(seatLimitReached(e, 3), true);
  assert.equal(seatLimitReached(e, 9), true);
});

test("blocked messages name the plan and the missing feature", () => {
  const e = resolveEntitlements(P1);
  assert.notEqual(featureBlockedMessage(e, "roleManagement"), null);
  assert.match(featureBlockedMessage(e, "roleManagement")!, /Package 1/);
  assert.match(featureBlockedMessage(e, "multiVendorLabTests")!, /Package 1/);
  // Included features produce no message.
  assert.equal(featureBlockedMessage(resolveEntitlements(P3), "roleManagement"), null);
  assert.match(seatLimitMessage(e), /1 staff account/);
  assert.match(seatLimitMessage(resolveEntitlements(P3)), /5 staff accounts/);
});
