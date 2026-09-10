/**
 * Server-only Razorpay helpers (REST API — no SDK dependency).
 *
 * The checkout flow: a doctor picks a plan → `POST /api/packages/order`
 * creates a Razorpay order and a `package_payments` row (status "created")
 * → the client opens Razorpay Checkout with that order id → on success the
 * browser calls `POST /api/packages/verify` which checks the payment
 * signature (HMAC-SHA256 of `order_id|payment_id` with the key secret),
 * marks the row "paid" and extends `users.trial_ends_at`.
 *
 * Configure RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET in .env. While they are
 * missing the checkout UI hides itself (isRazorpayConfigured exposes that
 * state to server components).
 */

import { createHmac, timingSafeEqual } from "crypto";

const RAZORPAY_API = "https://api.razorpay.com/v1";

export function getRazorpayKeyId(): string | null {
  const key = process.env.RAZORPAY_KEY_ID;
  return key && key.trim() ? key.trim() : null;
}

function getRazorpayKeySecret(): string | null {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  return secret && secret.trim() ? secret.trim() : null;
}

/** True when both credentials exist — used to show/hide the checkout UI. */
export function isRazorpayConfigured(): boolean {
  return getRazorpayKeyId() !== null && getRazorpayKeySecret() !== null;
}

export type RazorpayOrder = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

/** Creates a Razorpay order. Throws with a readable message on failure. */
export async function createRazorpayOrder(input: {
  amount: number; // paise
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();
  if (!keyId || !keySecret) throw new Error("Razorpay is not configured.");

  const res = await fetch(`${RAZORPAY_API}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amount,
      currency: "INR",
      receipt: input.receipt,
      notes: input.notes ?? {},
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Razorpay order failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return (await res.json()) as RazorpayOrder;
}

/**
 * Verifies the checkout handler's signature client→server payload:
 * HMAC-SHA256(`${order_id}|${payment_id}`, key_secret) === signature.
 */
export function verifyRazorpaySignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const keySecret = getRazorpayKeySecret();
  if (!keySecret) return false;
  const expected = createHmac("sha256", keySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(input.signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Verifies a webhook payload signature:
 * HMAC-SHA256(rawBody, webhookSecret) === x-razorpay-signature header.
 */
export function verifyRazorpayWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !secret.trim()) return false;
  const expected = createHmac("sha256", secret.trim()).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
