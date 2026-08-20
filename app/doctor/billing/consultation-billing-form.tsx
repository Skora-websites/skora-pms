"use client";

import { useActionState } from "react";
import { ReceiptText } from "lucide-react";
import { createBill } from "./actions";

type BillingType = { id: number; name: string; defaultAmount: string | null };

const initialState = { error: null as string | null };

export function ConsultationBillingForm({
  appointmentId,
  patientId,
  billingTypes,
}: {
  appointmentId: number;
  patientId: number;
  billingTypes: BillingType[];
}) {
  const [state, formAction, pending] = useActionState(createBill, initialState);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-100 text-accent-700">
          <ReceiptText className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Generate bill</h3>
          <p className="text-xs text-slate-400">Create a bill for this consultation.</p>
        </div>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="appointment_id" value={appointmentId} />
        <input type="hidden" name="patient_id" value={patientId} />

        <div>
          <label htmlFor="consult-billing_type_id" className="label">Billing type</label>
          <select
            id="consult-billing_type_id"
            name="billing_type_id"
            className="input"
            defaultValue=""
            required
          >
            <option value="" disabled>Select type...</option>
            {billingTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} · ₹{Number(t.defaultAmount ?? 0)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="consult-amount" className="label">Amount (₹)</label>
            <input
              id="consult-amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="500"
              className="input"
            />
          </div>
          <div>
            <label htmlFor="consult-payment_method" className="label">Payment method</label>
            <select
              id="consult-payment_method"
              name="payment_method"
              className="input"
              defaultValue="cash"
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="netbanking">Net banking</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="consult-notes" className="label">Notes (optional)</label>
          <input
            id="consult-notes"
            name="notes"
            className="input"
            placeholder="e.g. Consultation fee"
          />
        </div>

        {state.error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="btn-primary w-full !py-2.5 text-xs"
        >
          <ReceiptText className="h-4 w-4" />
          {pending ? "Generating..." : "Generate bill & mark paid"}
        </button>
      </form>
    </div>
  );
}