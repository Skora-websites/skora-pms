import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/guard";
import { verifyRazorpaySignature, fetchRazorpayPayment, type RazorpayPayment } from "@/lib/packages/razorpay";
import { fulfillPackagePayment } from "@/lib/packages/fulfillment";

/**
 * Client-checkout callback: verifies the Razorpay signature then extends
 * access. Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
export async function POST(request: Request) {
  // Role-only gate (see the order route): an expired trial MUST be able to
  // complete the purchase it started, otherwise the buyer pays while the
  // callback fails and access stays locked.
  const user = await requireApiRole(["doctor"]);
  if (user instanceof Response) return user;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const orderId = typeof body.razorpay_order_id === "string" ? body.razorpay_order_id : "";
  const paymentId = typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
  const signature = typeof body.razorpay_signature === "string" ? body.razorpay_signature : "";
  if (!orderId || !paymentId || !signature) {
    return NextResponse.json({ error: "Missing payment confirmation fields." }, { status: 400 });
  }

  if (!verifyRazorpaySignature({ orderId, paymentId, signature })) {
    console.error(`[packages/verify] Signature mismatch for order ${orderId}`);
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  // The signature proves Razorpay signed this order+payment pair — not that
  // the money was captured. Require a server-side fetch confirming capture
  // and the order binding before granting access.
  let payment: RazorpayPayment | null = null;
  try {
    payment = await fetchRazorpayPayment(paymentId);
  } catch (err) {
    console.error(`[packages/verify] Payment fetch failed for ${paymentId}:`, err);
    // Transient Razorpay failure — the payment.captured webhook is the
    // redundant fulfillment path; tell the client to wait rather than lie.
    return NextResponse.json(
      { error: "Payment confirmation is delayed. Your access activates automatically once it is confirmed." },
      { status: 502 }
    );
  }
  if (!payment) {
    return NextResponse.json({ error: "Payment not found." }, { status: 400 });
  }
  if (payment.order_id !== orderId) {
    console.error(
      `[packages/verify] Payment ${paymentId} is bound to order ${payment.order_id}, not ${orderId}`
    );
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }
  if (payment.status !== "captured") {
    return NextResponse.json(
      { error: "Payment was not completed. No access has been granted." },
      { status: 400 }
    );
  }

  const result = await fulfillPackagePayment({
    orderId,
    paymentId,
    signature,
    source: "checkout",
    callerId: user.id, // bound to the caller (audit F-14)
  });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({
    ok: true,
    accessUntil: result.accessUntil.toISOString(),
    alreadyFulfilled: result.alreadyFulfilled,
  });
}
