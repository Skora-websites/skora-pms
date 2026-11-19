import { notFound } from "next/navigation";
import Script from "next/script";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { billings, users } from "@/lib/db/schema";
import { getRazorpayKeyId, isRazorpayConfigured } from "@/lib/packages/razorpay";
import { CheckoutClient } from "./checkout-client";

export const metadata = {
  title: "Secure Bill Payment · Skora Care",
};

export default async function BillPaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { id } = await params;
  const { order_id: orderId } = await searchParams;
  const billId = Number(id);

  if (!Number.isInteger(billId) || !orderId) {
    notFound();
  }

  const [row] = await db
    .select({
      id: billings.id,
      billNumber: billings.billNumber,
      pendingAmount: billings.pendingAmount,
      totalAmount: billings.totalAmount,
      patientName: users.name,
      patientEmail: users.email,
      patientPhone: users.phone,
    })
    .from(billings)
    .innerJoin(users, eq(users.id, billings.patientId))
    .where(and(eq(billings.id, billId), isNull(billings.deletedAt)));

  if (!row) {
    notFound();
  }

  const keyId = getRazorpayKeyId();
  if (!keyId || !isRazorpayConfigured()) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
          <h1 className="text-xl font-bold text-slate-800">Payment Gateway Unavailable</h1>
          <p className="mt-2 text-sm text-slate-500">
            Online payments are currently not configured on this deployment. Please pay at the clinic.
          </p>
        </div>
      </div>
    );
  }

  const amountPaise = Math.round(Number(row.pendingAmount ?? 0) * 100);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <CheckoutClient
        billId={row.id}
        billNumber={row.billNumber}
        amountPaise={amountPaise}
        amountDisplay={Number(row.pendingAmount ?? 0)}
        orderId={orderId}
        keyId={keyId}
        patientName={row.patientName}
        patientEmail={row.patientEmail ?? ""}
        patientPhone={row.patientPhone ?? ""}
      />
    </div>
  );
}
