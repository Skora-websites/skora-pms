import type { Metadata } from "next";
import { ReceiptText, IndianRupee } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getPatientBills, getPatientPaymentHistory } from "@/lib/queries/patient";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui/dashboard-ui";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "My Bills · Patient" };
export const dynamic = "force-dynamic";

export default async function PatientBillsPage() {
  const user = await requireRole(["patient"]);
  const [bills, payments] = await Promise.all([
    getPatientBills(user.id),
    getPatientPaymentHistory(user.id),
  ]);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div>
      <PageHeader
        title="My bills"
        subtitle="Your payment receipts from consultations and tests"
      />

      {payments.length > 0 && (
        <div className="card mb-4 overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-600 text-white">
              <IndianRupee className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-ink">Payment history</h2>
              <p className="text-xs text-slate-400">
                {payments.length} payment{payments.length === 1 ? "" : "s"} recorded
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-slate-500">Total paid</p>
              <p className="text-lg font-bold text-accent-700">{formatINR(totalPaid)}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Bill</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{formatDate(p.date)}</td>
                    <td className="font-medium text-ink">{p.billNumber}</td>
                    <td className="capitalize">{p.paymentMethod ?? "—"}</td>
                    <td className="text-slate-500">{p.referenceNumber ?? "—"}</td>
                    <td className="text-right font-semibold text-accent-700">{formatINR(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 text-white">
                  <ReceiptText className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-ink">{b.billNumber}</h2>
                  <p className="text-xs text-slate-400">
                    Dr. {b.doctorName}{b.billingTypeName ? ` · ${b.billingTypeName}` : ""} · {formatDate(b.billDate)}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <StatusBadge status={b.status} />
                  <span className="text-lg font-bold text-ink">{formatINR(b.totalAmount)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 px-6 py-4 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-slate-500">Total</p>
                  <p className="text-sm font-semibold text-ink">{formatINR(b.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Paid</p>
                  <p className="text-sm font-semibold text-accent-700">{formatINR(b.receivedAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Pending</p>
                  <p className={`text-sm font-semibold ${Number(b.pendingAmount) > 0 ? "text-amber-600" : "text-slate-400"}`}>
                    {formatINR(b.pendingAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Payment</p>
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