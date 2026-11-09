import { NextResponse } from "next/server";
import { verifyRazorpayWebhookSignature } from "@/lib/packages/razorpay";
import { fulfillPackagePayment } from "@/lib/packages/fulfillment";
import { createLogger } from "@/lib/security/logger";

const log = createLogger("packages/webhook");

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
    log.error("Invalid webhook signature.", {
      bodyBytes: rawBody.length,
      signaturePresent: signature.length > 0,
    });
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
      if (!result.ok) {
        // Return 5xx so Razorpay retries. fulfillPackagePayment is
        // idempotent (atomic created → paid claim), so a retry either
        // completes the work or reports alreadyFulfilled — never a
        // double-grant. A 200 here would silently deny the customer
        // the access they paid for.
        log.error("Fulfillment failed; returning 5xx so Razorpay retries.", {
          orderId: entity.order_id,
          paymentId: entity.id,
          error: result.error,
        });
        return NextResponse.json({ error: result.error }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
