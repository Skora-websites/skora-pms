import type { Metadata } from "next";
import { ReceiptText } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getBillingOverview, getDoctorPatients } from "@/lib/queries/doctor";
import { PageHeader, EmptyState } from "@/components/ui/dashboard-ui";
import { BillForm } from "./bill-form";
import { BillTable } from "./bill-table";
import { BillCards } from "./bill-cards";
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

      {/* Summary cards — horizontal on mobile, grid on desktop */}
      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Total billed", value: formatINR(collected + pending) },
          { label: "Collected", value: formatINR(collected) },
          { label: "Pending", value: formatINR(pending) },
        ].map((s) => (
          <div key={s.label} className="card card-hover p-3 sm:p-5">
            <p className="text-[10px] text-slate-500 sm:text-xs">{s.label}</p>
            <p className="mt-2 font-display text-lg font-bold tracking-[-0.02em] tabular-nums text-ink sm:text-[26px] sm:leading-8">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6 lg:grid lg:grid-cols-[1fr_380px] lg:gap-6 lg:space-y-0">
        {/* Bill table (desktop) + card list (mobile) */}
        <div>
          {bills.length === 0 ? (
            <EmptyState
              icon={ReceiptText}
              title="No bills yet"
              description="Generate your first bill from the form."
            />
          ) : (
            <>
              <div className="hidden sm:block">
                <BillTable
                  bills={bills}
                  billingTypes={billingTypes.map((t) => ({ id: t.id, name: t.name, defaultAmount: t.defaultAmount }))}
                />
              </div>
              <BillCards
                bills={bills}
                billingTypes={billingTypes.map((t) => ({ id: t.id, name: t.name, defaultAmount: t.defaultAmount }))}
              />
            </>
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
