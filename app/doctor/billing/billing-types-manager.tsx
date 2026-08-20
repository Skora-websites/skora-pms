"use client";

import { useActionState, useState } from "react";
import { Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { createBillingType, updateBillingType, deleteBillingType } from "./actions";
import { formatINR } from "@/lib/utils";

type BillingType = { id: number; name: string; defaultAmount: string | null };

const initialState = { error: null as string | null };

export function BillingTypesManager({
  billingTypes,
}: {
  billingTypes: BillingType[];
}) {
  const [state, formAction, pending] = useActionState(createBillingType, initialState);
  const [editing, setEditing] = useState<BillingType | null>(null);
  const [editState, editAction, editPending] = useActionState(updateBillingType, initialState);

  if (editing) {
    return (
      <div className="card p-7">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">Edit billing type</h2>
            <p className="text-xs text-slate-400">Update the name or default amount.</p>
          </div>
          <button
            type="button"
            onClick={() => setEditing(null)}
            className="btn-secondary !py-2 !px-3 text-xs"
          >
            Cancel
          </button>
        </div>
        <form action={editAction} className="space-y-4">
          <input type="hidden" name="id" value={editing.id} />
          <div>
            <label htmlFor="bt-name" className="label">Name</label>
            <input
              id="bt-name"
              name="name"
              className="input"
              required
              defaultValue={editing.name}
              placeholder="e.g. Consultation fee"
            />
          </div>
          <div>
            <label htmlFor="bt-amount" className="label">Default amount (₹)</label>
            <input
              id="bt-amount"
              name="default_amount"
              type="number"
              min="0"
              step="0.01"
              className="input"
              required
              defaultValue={editing.defaultAmount ?? "0"}
            />
          </div>
          {editState.error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{editState.error}</p>
          )}
          <button type="submit" disabled={editPending} className="btn-primary w-full">
            <Pencil className="h-4 w-4" />
            {editPending ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="card p-7">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-800">
          <Tag className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-display text-base font-bold text-slate-900">Billing types</h2>
          <p className="text-xs text-slate-400">Predefined services used when generating bills.</p>
        </div>
      </div>

      <form action={formAction} className="mt-5 space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="bt-name" className="label">Name</label>
            <input
              id="bt-name"
              name="name"
              className="input"
              required
              placeholder="e.g. Consultation fee"
            />
          </div>
          <div>
            <label htmlFor="bt-amount" className="label">Default amount (₹)</label>
            <input
              id="bt-amount"
              name="default_amount"
              type="number"
              min="0"
              step="0.01"
              className="input"
              required
              defaultValue="0"
            />
          </div>
        </div>
        {state.error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
        )}
        <button type="submit" disabled={pending} className="btn-secondary w-full !py-2.5 text-xs">
          <Plus className="h-4 w-4" />
          {pending ? "Adding..." : "Add billing type"}
        </button>
      </form>

      <ul className="mt-5 divide-y divide-slate-100">
        {billingTypes.length === 0 && (
          <li className="py-6 text-center text-sm text-slate-400">
            No billing types yet. Add your first one above.
          </li>
        )}
        {billingTypes.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{t.name}</p>
              <p className="text-xs text-slate-400">{formatINR(t.defaultAmount)}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setEditing(t)}
                title="Edit"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-brand-800"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <form
                action={async () => {
                  await deleteBillingType(t.id);
                }}
              >
                <button
                  type="submit"
                  title="Deactivate"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
