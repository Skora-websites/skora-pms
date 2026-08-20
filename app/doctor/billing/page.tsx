import type { Metadata } from "next";
import { ReceiptText } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getBillingOverview, getDoctorPatients } from "@/lib/queries/doctor";
import { PageHeader, EmptyState } from "@/components/ui/dashboard-ui";
import { BillForm } from "./bill-form";
import { BillTable } from "./bill-table";
import { BillingTypesManager } from "./billing-types-manager";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Billing · Doctor" };

export default async function BillingPage() {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
  const [{ bills, billingTypes }, patients] = await Promise.all([
    getBillingOverview(doctorId),
    getDoctorPatients(doctorId),
  ]);

  const collected = bills.reduce((sum, b) => sum + Number(b.receivedAmount ?? 0), 0);
  const pending = bills.reduce((sum, b) => sum + Number(b.pendingAmount ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Billing"
        subtitle="Generate bills and track payments"
      />

      <div className="mb-6 grid gap-5 sm:grid-cols-3">
        {[
          { label: "Total billed", value: formatINR(collected + pending), tone: "text-brand-800" },
          { label: "Collected", value: formatINR(collected), tone: "text-accent-700" },
          { label: "Pending", value: formatINR(pending), tone: "text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{s.label}</p>
            <p className={`mt-2 font-display text-2xl font-extrabold ${s.tone}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div>
          {bills.length === 0 ? (
            <EmptyState
              icon={ReceiptText}
              title="No bills yet"
              description="Generate your first bill from the form."
            />
          ) : (
            <BillTable
              bills={bills}
              billingTypes={billingTypes.map((t) => ({ id: t.id, name: t.name, defaultAmount: t.defaultAmount }))}
            />
          )}
        </div>

        <div className="space-y-6">
          <BillForm
            patients={patients.map((p) => ({ id: p.id, name: p.name, phone: p.phone }))}
            billingTypes={billingTypes.map((t) => ({ id: t.id, name: t.name, defaultAmount: t.defaultAmount }))}
          />
          <BillingTypesManager billingTypes={billingTypes} />
        </div>
      </div>
    </div>
  );
}
