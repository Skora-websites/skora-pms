"use client";

import { useState } from "react";
import { FileDown, Pencil } from "lucide-react";
import { StatusBadge } from "@/components/ui/dashboard-ui";
import { formatINR, formatDate, cn } from "@/lib/utils";
import { EditBillForm, DeleteBillButton } from "./edit-bill-form";
import { CollectCreditButton } from "./collect-credit-button";

type Bill = {
  id: number;
  billNumber: string;
  patientId: number;
  patientName: string | null;
  billingTypeId: number | null;
  totalAmount: string;
  receivedAmount: string | null;
  pendingAmount: string | null;
  paymentMethod: string | null;
  status: string | null;
  notes: string | null;
  billDate: string;
};

type BillingType = { id: number; name: string; defaultAmount: string | null };

/**
 * Mobile-friendly bill list: one card per bill (sm:hidden), instead of the
 * 8-column table which is unusable on a phone screen.
 */
export function BillCards({
  bills,
  billingTypes,
}: {
  bills: Bill[];
  billingTypes: BillingType[];
}) {
  const [editing, setEditing] = useState<Bill | null>(null);

  return (
    <>
      <div className="space-y-3 sm:hidden">
        {bills.map((b) => (
          <div key={b.id} className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-mono text-xs font-semibold text-brand-800">{b.billNumber}</p>
                <p className="truncate text-sm font-semibold text-slate-900">{b.patientName ?? "—"}</p>
                <p className="text-xs text-slate-400">{formatDate(b.billDate)}</p>
              </div>
              <StatusBadge status={b.status} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-slate-400">Total</p>
                <p className="font-semibold text-slate-900">{formatINR(b.totalAmount)}</p>
              </div>
              <div>
                <p className="text-slate-400">Received</p>
                <p className="font-semibold text-accent-700">{formatINR(b.receivedAmount)}</p>
              </div>
              <div>
                <p className="text-slate-400">Pending</p>
                <p className={cn("font-semibold", Number(b.pendingAmount) > 0 ? "text-amber-600" : "text-slate-400")}>
                  {formatINR(b.pendingAmount)}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-slate-100 pt-3">
              {(b.status === "pending" || b.paymentMethod === "credit") && <CollectCreditButton billId={b.id} />}
              <a
                href={`/api/doctor/billing/${b.id}/pdf`}
                target="_blank"
                title="Print PDF"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-brand-50 hover:text-brand-800"
              >
                <FileDown className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={() => setEditing(b)}
                title="Edit"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <DeleteBillButton billId={b.id} />
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <EditBillForm
          bill={editing}
          billingTypes={billingTypes}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
