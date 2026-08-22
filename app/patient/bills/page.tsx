import type { Metadata } from "next";
import { ReceiptText } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getPatientBills } from "@/lib/queries/patient";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui/dashboard-ui";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "My Bills · Patient" };
export const dynamic = "force-dynamic";

export default async function PatientBillsPage() {
  const user = await requireRole(["patient"]);
  const bills = await getPatientBills(user.id);

  return (
    <div>
      <PageHeader
        title="My bills"
        subtitle="Your payment receipts from consultations and tests"
      />

      {bills.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No bills yet"
          description="Your receipts will appear here after any charges are created by your doctor."
        />
      ) : (
        <div className="space-y-4">
          {bills.map((b) => (
            <div key={b.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 to-accent-600 text-white">
                  <ReceiptText className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-sm font-bold text-slate-900">{b.billNumber}</h2>
                  <p className="text-xs text-slate-400">
                    Dr. {b.doctorName}{b.billingTypeName ? ` · ${b.billingTypeName}` : ""} · {formatDate(b.billDate)}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <StatusBadge status={b.status} />
                  <span className="text-lg font-bold text-slate-900">{formatINR(b.totalAmount)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 px-6 py-4 sm:grid-cols-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Total</p>
                  <p className="text-sm font-bold text-slate-900">{formatINR(b.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Paid</p>
                  <p className="text-sm font-semibold text-accent-700">{formatINR(b.receivedAmount)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Pending</p>
                  <p className={`text-sm font-semibold ${Number(b.pendingAmount) > 0 ? "text-amber-600" : "text-slate-400"}`}>
                    {formatINR(b.pendingAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Payment</p>
                  <p className="text-sm capitalize text-slate-700">{b.paymentMethod ?? "—"}</p>
                </div>
              </div>
              {b.notes && (
                <div className="border-t border-slate-100 px-6 py-3">
                  <p className="text-xs text-slate-400">{b.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}