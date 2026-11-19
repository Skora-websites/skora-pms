import { NextRequest } from "next/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { billings, transactions } from "@/lib/db/schema";
import { apiError, apiOk } from "@/app/api/mobile/_helpers";
import {
  fetchRazorpayPayment,
  verifyRazorpaySignature,
} from "@/lib/packages/razorpay";
import { todayStr } from "@/lib/utils";

export const runtime = "nodejs";

/**
 * POST /api/mobile/patient/bills/[id]/verify
 * Verifies Razorpay payment signature and marks the bill paid.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const billId = Number(id);
  if (!Number.isInteger(billId)) {
    return apiError("Invalid bill ID", 400);
  }

  let body: { orderId?: string; paymentId?: string; signature?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body", 400);
  }

  const { orderId, paymentId, signature } = body;
  if (!orderId || !paymentId || !signature) {
    return apiError("Missing payment verification details", 400);
  }

  // 1. Signature check
  const validSignature = verifyRazorpaySignature({ orderId, paymentId, signature });
  if (!validSignature) {
    return apiError("Invalid payment signature", 400);
  }

  // 2. Authoritative server check against Razorpay API
  const payment = await fetchRazorpayPayment(paymentId);
  if (!payment) {
    return apiError("Payment record not found on Razorpay", 400);
  }

  if (payment.status !== "captured") {
    return apiError(`Payment is not in captured state (status: ${payment.status})`, 400);
  }

  if (payment.order_id !== orderId) {
    return apiError("Payment does not match the requested order", 400);
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
    .where(and(eq(billings.id, billId), isNull(billings.deletedAt)));

  if (!bill) {
    return apiError("Bill not found", 404);
  }

  const paidAmount = Number(payment.amount) / 100;

  // 3. Update bill and insert audit transaction row
  await db
    .update(billings)
    .set({
      receivedAmount: sql`CAST(${bill.receivedAmount ?? "0"} AS DECIMAL(12,2)) + CAST(${paidAmount} AS DECIMAL(12,2))`,
      pendingAmount: sql`GREATEST(0, CAST(${bill.pendingAmount ?? "0"} AS DECIMAL(12,2)) - CAST(${paidAmount} AS DECIMAL(12,2)))`,
      status: "paid",
      paymentMethod: "upi",
    })
    .where(eq(billings.id, billId));

  await db.insert(transactions).values({
    userId: bill.patientId,
    type: 1, // income
    amount: String(paidAmount),
    date: todayStr(),
    status: "approved",
    billingId: bill.id,
    referenceNumber: paymentId,
    paymentMethod: "razorpay",
    description: `Online payment via Razorpay for Bill #${bill.billNumber}`,
    createdBy: "patient",
  });

  return apiOk({
    success: true,
    billId: bill.id,
    billNumber: bill.billNumber,
    paymentId,
    amount: paidAmount,
  });
}
