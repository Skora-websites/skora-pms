import { NextRequest } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { billings } from "@/lib/db/schema";
import { apiError, apiOk, requirePatientActor } from "@/app/api/mobile/_helpers";
import {
  createRazorpayOrder,
  getRazorpayKeyId,
  isRazorpayConfigured,
} from "@/lib/packages/razorpay";

export const runtime = "nodejs";

/**
 * POST /api/mobile/patient/bills/[id]/checkout
 * Creates a Razorpay payment order for the pending balance of a patient's bill.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requirePatientActor();
  if (user instanceof Response) return user;

  const { id } = await params;
  const billId = Number(id);
  if (!Number.isInteger(billId)) {
    return apiError("Invalid bill ID", 400);
  }

  const [bill] = await db
    .select({
      id: billings.id,
      billNumber: billings.billNumber,
      patientId: billings.patientId,
      totalAmount: billings.totalAmount,
      receivedAmount: billings.receivedAmount,
      pendingAmount: billings.pendingAmount,
      status: billings.status,
    })
    .from(billings)
    .where(
      and(
        eq(billings.id, billId),
        eq(billings.patientId, user.id),
        isNull(billings.deletedAt)
      )
    );

  if (!bill) {
    return apiError("Bill not found", 404);
  }

  const pending = Number(bill.pendingAmount ?? 0);
  if (pending <= 0 || bill.status === "paid") {
    return apiError("This bill has already been paid in full", 400);
  }

  if (!isRazorpayConfigured()) {
    return apiError("Online payments are currently not configured on this server", 503);
  }

  try {
    const amountInPaise = Math.round(pending * 100);
    const order = await createRazorpayOrder({
      amount: amountInPaise,
      receipt: bill.billNumber.slice(0, 39),
      notes: {
        billId: String(bill.id),
        billNumber: bill.billNumber,
        patientId: String(user.id),
      },
    });

    const keyId = getRazorpayKeyId();
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/+$/, "");
    const checkoutUrl = `${appUrl}/pay/bill/${bill.id}?order_id=${encodeURIComponent(order.id)}`;

    return apiOk({
      orderId: order.id,
      keyId,
      amount: pending,
      currency: "INR",
      billNumber: bill.billNumber,
      checkoutUrl,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create payment order";
    return apiError(msg, 500);
  }
}
