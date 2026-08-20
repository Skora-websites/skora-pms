"use client";

import { useActionState, useTransition } from "react";
import { ReceiptText, X } from "lucide-react";
import { updateBill, deleteBill } from "./actions";

type BillingType = { id: number; name: string; defaultAmount: string | null };
type Bill = {
  id: number;
  patientId: number;
  billingTypeId: number | null;
  totalAmount: string;
  receivedAmount: string | null;
  paymentMethod: string | null;
  notes: string | null;
};

const initialState = { error: null as string | null };

export function EditBillForm({
  bill,
  billingTypes,
  onClose,
}: {
  bill: Bill;
  billingTypes: BillingType[];
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateBill, initialState);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Edit bill</h2>
            <p className="text-xs text-slate-400">Update amounts, payment details, or notes.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form action={formAction} className="space-y-5">
          <input type="hidden" name="bill_id" value={bill.id} />
          <input type="hidden" name="patient_id" value={bill.patientId} />

          <div>
            <label htmlFor="billing_type_id" className="label">Billing type</label>
            <select
              id="billing_type_id"
              name="billing_type_id"
              className="input"
              required
              defaultValue={bill.billingTypeId ?? ""}
            >
              <option value="" disabled>Select type...</option>
              {billingTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} · ₹{Number(t.defaultAmount ?? 0)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="total_amount" className="label">Total amount (₹)</label>
              <input
                id="total_amount"
                name="total_amount"
                type="number"
                min="0"
                step="0.01"
                required
                className="input"
                defaultValue={bill.totalAmount}
              />
            </div>
            <div>
              <label htmlFor="received_amount" className="label">Received amount (₹)</label>
              <input
                id="received_amount"
                name="received_amount"
                type="number"
                min="0"
                step="0.01"
                required
                className="input"
                defaultValue={bill.receivedAmount ?? "0"}
              />
            </div>
          </div>

          <div>
            <label htmlFor="payment_method" className="label">Payment method</label>
            <select
              id="payment_method"
              name="payment_method"
              className="input"
              defaultValue={bill.paymentMethod ?? "cash"}
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="netbanking">Net banking</option>
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="label">Notes (optional)</label>
            <input
              id="notes"
              name="notes"
              className="input"
              placeholder="e.g. Partial payment"
              defaultValue={bill.notes ?? ""}
            />
          </div>

          {state.error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
          )}

          <button type="submit" disabled={pending} className="btn-primary w-full">
            <ReceiptText className="h-4 w-4" />
            {pending ? "Updating..." : "Update bill"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function DeleteBillButton({ billId }: { billId: number }) {
  const [, formAction, pending] = useActionState(
    async () => deleteBill(billId),
    initialState
  );
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (!window.confirm("Delete this bill permanently? This action cannot be undone.")) return;
    startTransition(() => {
      formAction();
    });
  };

  return (
    <button
      type="button"
      disabled={pending || isPending}
      onClick={handleClick}
      title="Delete"
      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      <X className="h-4 w-4" />
    </button>
  );
}
