/**
 * The money path's idempotency invariant (audit D2).
 *
 * `fulfillPackagePayment` is called from BOTH `/api/packages/verify` (the
 * browser checkout callback) and the Razorpay webhook. Those two fire for the
 * same payment on a normal purchase, so the function must be safe to call
 * twice — a double-extend would hand out free access, and the amount check
 * must hold on both paths.
 *
 * Run: npm run test
 */

import "dotenv/config";

import { test } from "node:test";
import assert from "node:assert/strict";
import { and, eq } from "drizzle-orm";
import { withCleanFixtures } from "../../../tests/helpers/db";
import { makeUser } from "../../../tests/helpers/fixtures";
import { db, schema } from "@/lib/db";
import { packagePayments, users } from "@/lib/db/schema";
import { fulfillPackagePayment } from "../fulfillment";
import { getPackagePricing } from "../config";
import { mayFulfillForUser } from "../buyers";

/** Insert a `created` payment row for `userId` and return its order id. */
async function seedPayment(userId: number, packageId: string, period: "monthly" | "yearly") {
  const pricing = getPackagePricing(packageId, period);
  if (!pricing) throw new Error(`no pricing for ${packageId}/${period}`);
  const orderId = `order_test_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  await db.insert(packagePayments).values({
    userId,
    buyerId: userId,
    packageId,
    packageName: pricing.plan.name,
    period,
    amount: pricing.amount,
    status: "created",
    razorpayOrderId: orderId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { orderId, amount: pricing.amount, days: pricing.days };
}

test("fulfilling twice does not extend access twice", async () => {
  await withCleanFixtures(async () => {
    const doctorId = await makeUser({ role: "doctor" });
    const { orderId, amount, days } = await seedPayment(doctorId, "package-1", "monthly");
    void amount;
    void days;

    const first = await fulfillPackagePayment({
      orderId,
      paymentId: "pay_first",
      source: "webhook",
    });
    assert.equal(first.ok, true);
    if (!first.ok) return;

    const [afterFirst] = await db
      .select({ trialEndsAt: users.trialEndsAt })
      .from(users)
      .where(eq(users.id, doctorId));

    const second = await fulfillPackagePayment({
      orderId,
      paymentId: "pay_second",
      source: "webhook",
    });
    assert.equal(second.ok, true);
    if (!second.ok) return;
    assert.equal(second.alreadyFulfilled, true, "the second call must report alreadyFulfilled");

    const [afterSecond] = await db
      .select({ trialEndsAt: users.trialEndsAt })
      .from(users)
      .where(eq(users.id, doctorId));

    // The access window is IDENTICAL — not extended again.
    assert.equal(
      afterFirst?.trialEndsAt?.getTime(),
      afterSecond?.trialEndsAt?.getTime(),
      "a second fulfillment must not add another plan period"
    );

    // And the payment row stays a single paid row.
    const [row] = await db
      .select({ status: packagePayments.status, paymentId: packagePayments.razorpayPaymentId })
      .from(packagePayments)
      .where(eq(packagePayments.razorpayOrderId, orderId));
    assert.equal(row?.status, "paid");
  });
});

test("the extension runs from the later of now and the current expiry", async () => {
  await withCleanFixtures(async () => {
    const doctorId = await makeUser({ role: "doctor" });
    // A renewal bought while the current access is still live. Milliseconds
    // are zeroed because `users.trial_ends_at` is a MySQL DATETIME (second
    // precision) — the stored value comes back truncated, so the expected
    // value must be truncated too.
    const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    future.setMilliseconds(0);
    await db.update(users).set({ trialEndsAt: future }).where(eq(users.id, doctorId));

    const { orderId, days } = await seedPayment(doctorId, "package-1", "monthly");
    const res = await fulfillPackagePayment({ orderId, paymentId: "pay_renew", source: "webhook" });
    assert.equal(res.ok, true);
    if (!res.ok) return;

    const expectedMs = future.getTime() + days * 24 * 60 * 60 * 1000;
    assert.equal(
      res.accessUntil.getTime(),
      expectedMs,
      "renewal must stack on the existing window, not reset it to now"
    );
  });
});

test("an overpaying/underpaying amount is refused rather than granting a plan", async () => {
  await withCleanFixtures(async () => {
    const doctorId = await makeUser({ role: "doctor" });
    const { orderId } = await seedPayment(doctorId, "package-1", "monthly");
    const pricing = getPackagePricing("package-1", "monthly")!;

    // Tamper the row's claimed amount so it no longer matches the catalog.
    await db
      .update(packagePayments)
      .set({ amount: pricing.amount - 1 })
      .where(eq(packagePayments.razorpayOrderId, orderId));

    const res = await fulfillPackagePayment({ orderId, paymentId: "pay_cheap", source: "webhook" });
    assert.equal(res.ok, false, "a mismatched amount must fail");
    if (res.ok) return;
    assert.match(res.error, /amount/i);

    // And no access was granted.
    const [u] = await db
      .select({ trialEndsAt: users.trialEndsAt })
      .from(users)
      .where(eq(users.id, doctorId));
    assert.equal(u?.trialEndsAt ?? null, null);
  });
});

test("the checkout binding refuses a caller who may not credit that user", () => {
  // mayFulfillForUser is the assertion the checkout path runs before any
  // write (audit F-14). A LIST is authoritative: only members pass.
  assert.equal(mayFulfillForUser(7, [1, 2, 3]), false, "a foreign user id is refused");
  assert.equal(mayFulfillForUser(3, [1, 2, 3]), true, "a member of the caller's set passes");
  assert.equal(mayFulfillForUser(3, []), false, "an empty allowance refuses everything");

  // ABSENT means "no session" — the webhook path only, which is never
  // produced by the checkout route. Documented behaviour, not a hole: the
  // webhook's authority is the HMAC signature, not a session.
  assert.equal(mayFulfillForUser(3, undefined), true);
});

test("an unknown order is refused without creating anything", async () => {
  await withCleanFixtures(async () => {
    const res = await fulfillPackagePayment({
      orderId: "order_does_not_exist",
      paymentId: "pay_x",
      source: "webhook",
    });
    assert.equal(res.ok, false);
    if (res.ok) return;
    assert.match(res.error, /unknown/i);

    const rows = await db.select({ id: schema.packagePayments.id }).from(schema.packagePayments).limit(1);
    assert.equal(rows.length, 0);
  });
});
