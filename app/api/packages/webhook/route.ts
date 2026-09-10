import { NextResponse } from "next/server";
import { verifyRazorpayWebhookSignature } from "@/lib/packages/razorpay";
import { fulfillPackagePayment } from "@/lib/packages/fulfillment";

/**
 * Razorpay webhook (redundant fulfillment path — covers browsers that close
 * before the checkout callback fires). Configure in the Razorpay dashboard:
 * event `payment.captured`, URL /api/packages/webhook, secret in
 * RAZORPAY_WEBHOOK_SECRET. Webhook signatures are HMAC over the RAW body,
 * so the body is read as text and parsed manually.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
    console.error("[packages/webhook] Invalid webhook signature.");
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (event.event === "payment.captured") {
    const entity = event.payload?.payment?.entity;
    if (entity?.order_id && entity.id) {
      const result = await fulfillPackagePayment({
        orderId: entity.order_id,
        paymentId: entity.id,
        source: "webhook",
      });
      if (!result.ok) console.error(`[packages/webhook] Fulfillment failed: ${result.error}`);
    }
  }

  // Always 200 so Razorpay stops retrying; failures are logged above.
  return NextResponse.json({ ok: true });
}
