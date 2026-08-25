"use client";

import { useState, useActionState } from "react";
import { PlusCircle } from "lucide-react";
import { createTransaction } from "../actions";

type Category = { id: number; name: string };

const initialState = { error: null as string | null };

export function TransactionForm({
  incomeTypes,
  expenseTypes,
}: {
  incomeTypes: Category[];
  expenseTypes: Category[];
}) {
  const [state, formAction, pending] = useActionState(createTransaction, initialState);
  const [type, setType] = useState<"1" | "2">("1");

  const categories = type === "1" ? incomeTypes : expenseTypes;
  const today = new Date().toLocaleDateString("en-CA");

  return (
    <div className="card h-fit p-7">
      <h2 className="font-display text-base font-bold text-slate-900">Add entry</h2>
      <form action={formAction} className="mt-5 space-y-5">
        <div>
          <label className="label">Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("1")}
              className={`rounded-xl border-2 py-2.5 text-sm font-semibold transition-colors ${
                type === "1"
                  ? "border-accent-500 bg-accent-50 text-accent-800"
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setType("2")}
              className={`rounded-xl border-2 py-2.5 text-sm font-semibold transition-colors ${
                type === "2"
                  ? "border-rose-400 bg-rose-50 text-rose-700"
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              Expense
            </button>
          </div>
          <input type="hidden" name="type" value={type} />
        </div>

        <div>
          <label htmlFor="amount" className="label">Amount (₹)</label>
          <input id="amount" name="amount" type="number" min="0.01" step="0.01" required placeholder="0.00" className="input" />
        </div>

        <div>
          <label htmlFor="date" className="label">Date</label>
          <input id="date" name="date" type="date" required defaultValue={today} className="input" />
        </div>

        {categories.length > 0 && (
          <div>
            <label htmlFor="category" className="label">Category</label>
            <select id="category" name={type === "1" ? "income_type_id" : "expense_type_id"} className="input" defaultValue="">
              <option value="" disabled>Select category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="description" className="label">Description</label>
          <input id="description" name="description" placeholder="What is this for?" className="input" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="payment_method" className="label">Payment method</label>
            <select id="payment_method" name="payment_method" className="input" defaultValue="">
              <option value="" disabled>Select...</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="netbanking">Net banking</option>
            </select>
          </div>
          <div>
            <label htmlFor="reference_number" className="label">Reference no.</label>
            <input id="reference_number" name="reference_number" placeholder="e.g. UTR / receipt" className="input" />
          </div>
        </div>

        <div>
          <label htmlFor="file" className="label">Attachment (optional)</label>
          <input
            id="file"
            name="file"
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            className="input file-input"
          />
          <p className="mt-1 text-xs text-slate-400">PDF, JPG or PNG · under 3 MB</p>
        </div>

        {state.error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
        )}

        <button type="submit" disabled={pending} className="btn-primary w-full !rounded-xl !py-3.5">
          <PlusCircle className="h-4 w-4" />
          {pending ? "Saving…" : "Add entry"}
        </button>
      </form>
    </div>
  );
}
