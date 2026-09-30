import type { Metadata } from "next";
import { requireAdminTier } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { getBillingOverview, getDoctorPatients } from "@/lib/queries/doctor";
import { PageHeader, EmptyState } from "@/components/ui/dashboard-ui";
import { BillForm } from "@/app/doctor/billing/bill-form";
import { BillTable } from "@/app/doctor/billing/bill-table";
import { BillingTypesManager } from "@/app/doctor/billing/billing-types-manager";
import { formatINR } from "@/lib/utils";
import { ReceiptText } from "lucide-react";

export const metadata: Metadata = { title: "Billing · Business" };

/**
 * Admin-tier billing: full bill CRUD (create / edit / collect credit /
 * delete) + billing-type management across the whole business. The shared
 * doctor billing actions enforce the write scope server-side.
 */
export default async function AdminBillingPage() {
  await requireAdminTier("/admin/billing");
  const scope = await getBusinessScope();

  const [overview, patients] = await Promise.all([
    getBillingOverview(scope.doctorIds),
    getDoctorPatients(scope.doctorIds[0] ?? 0),
  ]);
  const bills = overview.bills;
  const billingTypes = overview.billingTypes.map((t) => ({
    id: t.id,
    name: t.name,
    defaultAmount: t.defaultAmount,
  }));

  const totals = bills.reduce(
    (acc, b) => {
      acc.total += Number(b.totalAmount ?? 0);
      acc.received += Number(b.receivedAmount ?? 0);
      acc.pending += Number(b.pendingAmount ?? 0);
      return acc;
    },
    { total: 0, received: 0, pending: 0 }
  );

  return (
    <div>
      <PageHeader
        title="Billing"
        subtitle={`${bills.length} bill${bills.length === 1 ? "" : "s"} across your business`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Billed</p>
          <p className="mt-1 text-xl font-bold text-ink">{formatINR(totals.total)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Received</p>
          <p className="mt-1 text-xl font-bold text-brand-800">{formatINR(totals.received)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pending</p>
          <p className="mt-1 text-xl font-bold text-rose-600">{formatINR(totals.pending)}</p>
        </div>
      </div>

      {bills.length === 0 && billingTypes.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={ReceiptText}
            title="No bills yet"
            description="Create your first bill — patients and billing types can be managed here."
          />
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_2fr] [&>*]:min-w-0">
        <div className="space-y-4">
          <BillForm
            patients={patients.map((p) => ({ id: p.id, name: p.name, phone: p.phone }))}
            billingTypes={billingTypes}
          />
          <BillingTypesManager billingTypes={billingTypes} />
        </div>
        <div className="min-w-0">
          {bills.length === 0 ? (
            <div className="card flex h-full items-center justify-center p-10 text-sm text-slate-400">
              Bills created here or at your clinics will appear in this list.
            </div>
          ) : (
            <BillTable bills={bills} billingTypes={billingTypes} />
          )}
        </div>
      </div>
    </div>
  );
}
