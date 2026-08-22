"use client";

import { useState } from "react";
import { FileDown, Pencil } from "lucide-react";
import { StatusBadge } from "@/components/ui/dashboard-ui";
import { formatINR, formatDate } from "@/lib/utils";
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

export function BillTable({
  bills,
  billingTypes,
}: {
  bills: Bill[];
  billingTypes: BillingType[];
}) {
  const [editing, setEditing] = useState<Bill | null>(null);

  return (
    <>
      <div className="table-shell">
        <table className="data-table">
          <thead>
            <tr>
              <th>Bill no.</th>
              <th>Patient</th>
              <th>Date</th>
              <th>Total</th>
              <th>Received</th>
              <th>Pending</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((b) => (
              <tr key={b.id}>
                <td className="font-mono text-xs font-semibold text-brand-800">{b.billNumber}</td>
                <td className="font-semibold text-slate-900">{b.patientName ?? "—"}</td>
                <td>{formatDate(b.billDate)}</td>
                <td className="font-semibold">{formatINR(b.totalAmount)}</td>
                <td className="text-accent-700">{formatINR(b.receivedAmount)}</td>
                <td className={Number(b.pendingAmount) > 0 ? "font-semibold text-amber-600" : "text-slate-400"}>
                  {formatINR(b.pendingAmount)}
                </td>
                <td><StatusBadge status={b.status} /></td>
                <td>
                  <div className="flex items-center justify-end gap-1.5">
                    {(b.status === "pending" || b.paymentMethod === "credit") && (
                      <CollectCreditButton billId={b.id} />
                    )}
                    <a
                      href={`/api/doctor/billing/${b.id}/pdf`}
                      target="_blank"
                      title="Print bill PDF"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-brand-50 hover:text-brand-800"
                    >
                      <FileDown className="h-4 w-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setEditing(b)}
                      title="Edit bill"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <DeleteBillButton billId={b.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
