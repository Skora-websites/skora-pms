import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mayFulfillForUser,
  resolvePlanPurchaseTarget,
} from "../buyers";

test("a doctor buys their own practice — target and binding are both self", () => {
  const t = resolvePlanPurchaseTarget({
    role: "doctor",
    userId: 7,
    businessDoctorIds: [7],
  });
  assert.equal(t.targetUserId, 7);
  assert.deepEqual(t.mayCreditUserIds, [7]);
  assert.equal(mayFulfillForUser(7, t.mayCreditUserIds), true);
  assert.equal(mayFulfillForUser(8, t.mayCreditUserIds), false);
});

test("a doctor's binding ignores their business's other doctors", () => {
  const t = resolvePlanPurchaseTarget({
    role: "doctor",
    userId: 7,
    businessDoctorIds: [7, 9, 11],
  });
  assert.deepEqual(t.mayCreditUserIds, [7]);
});

test("an owner credits the practice anchor doctor, the same anchor writes use", () => {
  const t = resolvePlanPurchaseTarget({
    role: "admin",
    userId: 3,
    businessDoctorIds: [9, 7],
  });
  assert.equal(t.targetUserId, 9);
  // Any of the business's doctors may be paid for; only those.
  assert.equal(mayFulfillForUser(9, t.mayCreditUserIds), true);
  assert.equal(mayFulfillForUser(7, t.mayCreditUserIds), true);
  assert.equal(mayFulfillForUser(11, t.mayCreditUserIds), false);
});

test("an owner with no linked clinic has nothing to credit", () => {
  const t = resolvePlanPurchaseTarget({ role: "admin", userId: 3, businessDoctorIds: [] });
  assert.equal(t.targetUserId, null);
  assert.deepEqual(t.mayCreditUserIds, []);
});

test("duplicate business doctor ids collapse", () => {
  const t = resolvePlanPurchaseTarget({
    role: "admin",
    userId: 3,
    businessDoctorIds: [9, 9, 7],
  });
  assert.deepEqual(t.mayCreditUserIds, [9, 7]);
});

test("a clinic manager may neither buy nor credit", () => {
  const t = resolvePlanPurchaseTarget({
    role: "manager",
    userId: 4,
    businessDoctorIds: [9, 7],
  });
  assert.equal(t.targetUserId, null);
  assert.deepEqual(t.mayCreditUserIds, []);
});

test("the webhook path (no session) passes no binding list", () => {
  assert.equal(mayFulfillForUser(7, undefined), true);
});
