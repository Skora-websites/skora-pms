"use client";

import { useActionState } from "react";
import { ReceiptText } from "lucide-react";
import { createBill } from "./actions";

type Patient = { id: number; name: string; phone: string | null };
type BillingType = { id: number; name: string; defaultAmount: string | null };

const initialState = { error: null as string | null };

export function BillForm({
  patients,
  billingTypes,
}: {
  patients: Patient[];
  billingTypes: BillingType[];
}) {
  const [state, formAction, pending] = useActionState(createBill, initialState);

  return (
    <div className="card p-7">
      <h2 className="font-display text-base font-bold text-slate-900">Generate new bill</h2>
      <form action={formAction} className="mt-5 space-y-5">
        <div>
          <label htmlFor="patient_id" className="label">Patient</label>
          <select id="patient_id" name="patient_id" className="input" defaultValue="" required>
            <option value="" disabled>Select patient…</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.phone ? `· ${p.phone}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="billing_type_id" className="label">Billing type</label>
          <select id="billing_type_id" name="billing_type_id" className="input" defaultValue="" required>
            <option value="" disabled>Select type…</option>
            {billingTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} · ₹{Number(t.defaultAmount ?? 0)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="amount" className="label">Amount (₹)</label>
          <input id="amount" name="amount" type="number" min="0" step="0.01" required placeholder="500" className="input" />
        </div>
        <div>
          <label htmlFor="payment_method" className="label">Payment method</label>
          <select id="payment_method" name="payment_method" className="input" defaultValue="cash">
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="netbanking">Net banking</option>
            <option value="credit">48-hour credit</option>
          </select>
          <p className="mt-1 text-xs text-slate-400">
            Credit bills stay pending until you collect the payment.
          </p>
        </div>
        <div>
          <label htmlFor="notes" className="label">Notes (optional)</label>
          <input id="notes" name="notes" placeholder="e.g. Consultation + medicines" className="input" />
        </div>
        {state.error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
        )}
        <button type="submit" disabled={pending} className="btn-primary w-full !rounded-xl !py-3.5">
          <ReceiptText className="h-4 w-4" />
          {pending ? "Generating…" : "Generate bill"}
        </button>
      </form>
    </div>
  );
}
