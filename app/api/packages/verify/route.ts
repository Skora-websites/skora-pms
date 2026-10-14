import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/guard";
import { isTrialExpired } from "@/lib/auth/user";
import { verifyRazorpaySignature } from "@/lib/packages/razorpay";
import { fulfillPackagePayment } from "@/lib/packages/fulfillment";

/**
 * Client-checkout callback: verifies the Razorpay signature then extends
 * access. Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
export async function POST(request: Request) {
  // Role + trial only (see the order route): no "packages" module exists in
  // DOCTOR_ROUTE_PERMISSIONS, and an expired trial must not re-extend access
  // through the purchase path.
  const user = await requireApiRole(["doctor"]);
  if (user instanceof Response) return user;
  if (isTrialExpired(user)) return NextResponse.json({ error: "Trial expired." }, { status: 403 });

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
