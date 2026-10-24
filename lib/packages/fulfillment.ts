/**
 * Shared package-purchase fulfillment — the single place where a verified
 * payment extends a doctor's access. Called from `/api/packages/verify`
 * (client checkout handler) and the Razorpay webhook (redundancy).
 *
 * Idempotent: a payment id can only be fulfilled once (guarded by the
 * package_payments row's status transition created → paid inside a
 * transaction; the webhook and the browser callback race safely).
 *
 * Approach C: `users.trial_ends_at` stays the authoritative access expiry —
 * fulfillment extends it to `max(current, now) + plan.days`, so the existing
 * doctor-layout guard and /trial-expired flow keep working unchanged.
 */

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { packagePayments, users } from "@/lib/db/schema";
import { getPackagePricing, type PackagePeriod } from "./config";
import { mayFulfillForUser } from "./buyers";
import { auditLog } from "@/lib/security/audit-log";

export type FulfillmentResult =
  | { ok: true; accessUntil: Date; alreadyFulfilled: boolean }
  | { ok: false; error: string };

/**
 * Marks the payment row paid (if not already) and extends the buyer's
 * access. `orderId` is the idempotency key.
 */
export async function fulfillPackagePayment(input: {
  orderId: string;
  paymentId: string | null;
  signature?: string | null;
  source: "checkout" | "webhook";
  /**
   * Checkout binding (audit F-14) in set form: the browser callback may only
   * fulfill payments credited to one of these user ids. The buyer is no
   * longer always the credited user — a business owner pays for their
   * practice's anchor doctor — so the binding is the caller's authorized
   * target set from lib/packages/buyers.ts, not a single id.
   *
   * The webhook path has no session and legitimately omits it.
   */
  callerMayCreditUserIds?: number[];
}): Promise<FulfillmentResult> {
  const [payment] = await db
    .select()
    .from(packagePayments)
    .where(eq(packagePayments.razorpayOrderId, input.orderId))
    .limit(1);
  if (!payment) return { ok: false, error: "Unknown order." };

  // Checkout binding (audit F-14): an authenticated caller can only fulfill
  // payments credited to a user they are allowed to pay for (their own
  // practice, or — for a business owner — their practice's doctors). The
  // HMAC signature proves the payment is real, not that the caller owns it.
  if (
    input.source === "checkout" &&
    !mayFulfillForUser(payment.userId, input.callerMayCreditUserIds)
  ) {
    return { ok: false, error: "This order belongs to a different account." };
  }

  if (payment.status === "paid") {
    // Already fulfilled (webhook raced the browser callback, or a retry) —
    // report success with the recorded expiry, never double-extend.
    return { ok: true, accessUntil: payment.accessUntil ?? new Date(), alreadyFulfilled: true };
  }

  const pricing = getPackagePricing(payment.packageId, payment.period as PackagePeriod);
  if (!pricing) return { ok: false, error: "Unknown package." };

  // Charged-amount verification: a valid HMAC proves Razorpay produced the
  // event, not that the buyer paid the price the row claims. Both the webhook
  // and the browser checkout converge here, so one assertion closes both.
  if (payment.amount !== pricing.amount) {
    return { ok: false, error: "Charged amount does not match the package price." };
  }

  const [buyer] = await db
    .select({ id: users.id, role: users.role, trialEndsAt: users.trialEndsAt })
    .from(users)
    .where(eq(users.id, payment.userId))
    .limit(1);
  if (!buyer) return { ok: false, error: "Buyer not found." };

  const now = Date.now();
  const base = buyer.trialEndsAt && buyer.trialEndsAt.getTime() > now ? buyer.trialEndsAt.getTime() : now;
  const accessUntil = new Date(base + pricing.days * 24 * 60 * 60 * 1000);

  // Atomic claim: only the writer that flips created → paid extends access.
  const [claimResult] = await db
    .update(packagePayments)
    .set({
      status: "paid",
      razorpayPaymentId: input.paymentId,
      razorpaySignature: input.signature ?? null,
      accessUntil,
      updatedAt: new Date(),
    })
    .where(and(eq(packagePayments.razorpayOrderId, input.orderId), eq(packagePayments.status, "created")));

  // Another fulfillment (webhook vs browser) won the race between our read
  // and update — do not extend twice.
  if (claimResult.affectedRows === 0) {
    const [winner] = await db
      .select({ accessUntil: packagePayments.accessUntil })
      .from(packagePayments)
      .where(eq(packagePayments.razorpayOrderId, input.orderId))
      .limit(1);
    return { ok: true, accessUntil: winner?.accessUntil ?? accessUntil, alreadyFulfilled: true };
  }

  await db
    .update(users)
    .set({ trialEndsAt: accessUntil, packageId: payment.packageId, updatedAt: new Date() })
    .where(eq(users.id, payment.userId));

  await auditLog({
    // Attribute the purchase to the ACCOUNT THAT PAID (the buyer), not the
    // credited practice doctor — an owner buying for their practice is the
    // actor here. Pre-0023 rows have no buyer and fall back to the doctor.
    userId: payment.buyerId ?? payment.userId,
    action: "settings_updated",
    metadata: {
      event: "package_purchased",
      source: input.source,
      buyerId: payment.buyerId ?? null,
      creditedUserId: payment.userId,
      packageId: payment.packageId,
      packageName: payment.packageName,
      period: payment.period,
      amount: payment.amount,
      orderId: input.orderId,
      paymentId: input.paymentId,
      accessUntil: accessUntil.toISOString(),
    },
  });

  return { ok: true, accessUntil, alreadyFulfilled: false };
}

/** Most recent payments first — used by the super-admin payments panel. */
export async function getRecentPackagePayments(limit = 50) {
  return db
    .select({
      id: packagePayments.id,
      userId: packagePayments.userId,
      buyerId: packagePayments.buyerId,
      userName: users.name,
      userEmail: users.email,
      packageName: packagePayments.packageName,
      period: packagePayments.period,
      amount: packagePayments.amount,
      status: packagePayments.status,
      razorpayOrderId: packagePayments.razorpayOrderId,
      razorpayPaymentId: packagePayments.razorpayPaymentId,
      accessUntil: packagePayments.accessUntil,
      createdAt: packagePayments.createdAt,
    })
    .from(packagePayments)
    .innerJoin(users, eq(users.id, packagePayments.userId))
    .orderBy(desc(packagePayments.createdAt))
    .limit(limit);
}
