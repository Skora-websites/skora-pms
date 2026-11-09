import "dotenv/config";

import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
} from "../razorpay";

/**
 * The money path's signature checks (audit D2).
 *
 * These are pure functions, so the invariants are pinned without a live
 * Razorpay account: a tampered payload, a swapped signature, a missing
 * secret, and the constant-time-compare contract.
 *
 * The webhook verifier reads RAZORPAY_WEBHOOK_SECRET from the environment at
 * call time (so the runner's own .env cannot influence the assertions), set
 * and restored around each case.
 */

const secret = "whsec_test_value_0000000000000000000";
const prev = process.env.RAZORPAY_WEBHOOK_SECRET;

function withSecret<T>(value: string | undefined, body: () => T): T {
  process.env.RAZORPAY_WEBHOOK_SECRET = value;
  try {
    return body();
  } finally {
    if (prev === undefined) delete process.env.RAZORPAY_WEBHOOK_SECRET;
    else process.env.RAZORPAY_WEBHOOK_SECRET = prev;
  }
}

function signWebhook(body: string, s = secret): string {
  return crypto.createHmac("sha256", s).update(body).digest("hex");
}

test("a correctly signed webhook body is accepted", () => {
  const body = JSON.stringify({ event: "payment.captured", payload: {} });
  withSecret(secret, () => {
    assert.equal(verifyRazorpayWebhookSignature(body, signWebhook(body)), true);
  });
});

test("a body altered after signing is refused — the signature covers the RAW body", () => {
  const body = JSON.stringify({ event: "payment.captured", payload: {} });
  const forged = JSON.stringify({ event: "payment.captured", amount: 1 });
  withSecret(secret, () => {
    // The amount was changed but the original signature is replayed.
    assert.equal(verifyRazorpayWebhookSignature(forged, signWebhook(body)), false);
  });
});

test("a signature computed over a parsed-then-reserialized body is refused", () => {
  // The classic mistake: hashing req.json() instead of the raw text. Any
  // whitespace or key-order difference changes the digest, so a signature
  // over the re-serialized form must not validate against the raw body.
  // Razorpay sends a compact body; a proxy or a pretty-printer that touches
  // it before verification breaks the signature exactly this way.
  const raw = '{ "event" : "payment.captured" , "payload" : {} }';
  const reserialized = JSON.stringify(JSON.parse(raw));
  assert.notEqual(raw, reserialized, "this body must not round-trip byte-identically");
  withSecret(secret, () => {
    assert.equal(verifyRazorpayWebhookSignature(raw, signWebhook(reserialized)), false);
    assert.equal(verifyRazorpayWebhookSignature(raw, signWebhook(raw)), true);
  });
});

test("a signature from a DIFFERENT secret is refused", () => {
  const body = "{}";
  withSecret(secret, () => {
    assert.equal(verifyRazorpayWebhookSignature(body, signWebhook(body, "other_secret")), false);
  });
});

test("a missing or blank webhook secret fails closed, never open", () => {
  const body = "{}";
  const sig = signWebhook(body);
  withSecret(undefined, () => {
    assert.equal(verifyRazorpayWebhookSignature(body, sig), false);
  });
  withSecret("   ", () => {
    assert.equal(verifyRazorpayWebhookSignature(body, sig), false);
  });
});

test("an empty signature is refused, and the comparison is length-guarded", () => {
  const body = "{}";
  withSecret(secret, () => {
    assert.equal(verifyRazorpayWebhookSignature(body, ""), false);
    assert.equal(verifyRazorpayWebhookSignature(body, "abc"), false);
  });
});

test("the checkout signature binds order and payment together", () => {
  // verifyRazorpaySignature reads RAZORPAY_KEY_SECRET from config, which the
  // local .env does not set; it must then fail closed rather than open.
  const prevKey = process.env.RAZORPAY_KEY_SECRET;
  process.env.RAZORPAY_KEY_SECRET = "key_secret_test";
  try {
    const orderId = "order_test_123";
    const paymentId = "pay_test_456";
    const good = crypto
      .createHmac("sha256", "key_secret_test")
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
    assert.equal(verifyRazorpaySignature({ orderId, paymentId, signature: good }), true);

    // A signature swapping payment ids (the confuse-two-payments attack) fails.
    const swapped = crypto
      .createHmac("sha256", "key_secret_test")
      .update(`${orderId}|pay_TEST_other`)
      .digest("hex");
    assert.equal(verifyRazorpaySignature({ orderId, paymentId, signature: swapped }), false);
  } finally {
    if (prevKey === undefined) delete process.env.RAZORPAY_KEY_SECRET;
    else process.env.RAZORPAY_KEY_SECRET = prevKey;
  }
});

test("with no key secret, the checkout signature check fails closed", () => {
  const prevKey = process.env.RAZORPAY_KEY_SECRET;
  delete process.env.RAZORPAY_KEY_SECRET;
  try {
    assert.equal(
      verifyRazorpaySignature({ orderId: "o", paymentId: "p", signature: "deadbeef" }),
      false
    );
  } finally {
    if (prevKey !== undefined) process.env.RAZORPAY_KEY_SECRET = prevKey;
  }
});
