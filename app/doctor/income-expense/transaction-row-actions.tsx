"use client";

import { useActionState, useState, useTransition } from "react";
import { Paperclip, Pencil, Trash2 } from "lucide-react";
import { deleteTransaction, updateTransaction, updateTransactionStatus } from "./actions";

type Transaction = {
  id: number;
  type: number;
  amount: string;
  date: string;
  status: string | null;
  description: string | null;
  referenceNumber: string | null;
  paymentMethod: string | null;
  incomeTypeId: number | null;
  expenseTypeId: number | null;
  billingId: number | null;
  filePath: string | null;
  incomeType: string | null;
  expenseType: string | null;
};

type Category = { id: number; name: string };

const initialState = { error: null as string | null };

const STATUS_LABELS: Record<string, string> = {
  approved: "Approved",
  unapproved: "Unapproved",
  pending: "Pending",
};

const STATUS_TONES: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  unapproved: "bg-slate-100 text-slate-600 border-slate-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
};

export function TransactionRowActions({
  tx,
  incomeTypes,
  expenseTypes,
}: {
  tx: Transaction;
  incomeTypes: Category[];
  expenseTypes: Category[];
}) {
  const [editing, setEditing] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isStatusPending, startStatusTransition] = useTransition();
  const isBillingLinked = tx.billingId != null;

  const changeStatus = (status: string) => {
    setStatusError(null);
    startStatusTransition(async () => {
      const res = await updateTransactionStatus(tx.id, status);
      if (res?.error) setStatusError(res.error);
    });
  };

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        {tx.filePath && (
          <a
            href={`/api/doctor/income-expense/${tx.id}/file`}
            target="_blank"
            rel="noreferrer"
            title="View attachment"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-brand-800"
          >
            <Paperclip className="h-3.5 w-3.5" />
          </a>
        )}
        <button
          type="button"
          disabled={isBillingLinked}
          onClick={() => setEditing(true)}
          title={isBillingLinked ? "Auto-generated from a bill" : "Edit"}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-brand-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <DeleteTransactionButton txId={tx.id} disabled={isBillingLinked} billingLinked={isBillingLinked} />
      </div>

      {editing && (
        <EditTransactionModal
          tx={tx}
          incomeTypes={incomeTypes}
          expenseTypes={expenseTypes}
          onClose={() => setEditing(false)}
        />
      )}

      {!isBillingLinked && (
        <div className="mt-2 flex justify-end">
          <select
            value={tx.status ?? "pending"}
            disabled={isStatusPending}
            onChange={(e) => changeStatus(e.target.value)}
            className={`rounded-lg border px-2 py-1 text-xs font-semibold capitalize ${
              STATUS_TONES[tx.status ?? "pending"] ?? "bg-slate-100 text-slate-600"
            }`}
            title="Update status"
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      )}
      {statusError && (
        <p className="mt-1 text-right text-xs text-red-600">{statusError}</p>
      )}
    </>
  );
}

function DeleteTransactionButton({
  txId,
  disabled,
  billingLinked,
}: {
  txId: number;
  disabled: boolean;
  billingLinked: boolean;
}) {
  const [, formAction, pending] = useActionState(
    async () => deleteTransaction(txId),
    initialState
  );
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    const message = billingLinked
      ? "This income was auto-generated from a bill. Delete the bill to remove it."
      : "Delete this transaction permanently? This action cannot be undone.";
    if (!window.confirm(message)) return;
    startTransition(() => formAction());
  };

  return (
    <button
      type="button"
      disabled={disabled || pending || isPending}
      onClick={handleClick}
      title={billingLinked ? "Auto-generated from a bill" : "Delete"}
      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

function EditTransactionModal({
  tx,
  incomeTypes,
  expenseTypes,
  onClose,
}: {
  tx: Transaction;
  incomeTypes: Category[];
  expenseTypes: Category[];
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateTransaction, initialState);
  const [type, setType] = useState<"1" | "2">(tx.type === 2 ? "2" : "1");
  const categories = type === "1" ? incomeTypes : expenseTypes;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Edit entry</h2>
            <p className="text-xs text-slate-400">Update details of this transaction.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <span aria-hidden>✕</span>
          </button>
        </div>

        <form action={formAction} className="space-y-5">
          <input type="hidden" name="id" value={tx.id} />

          <div>
            <label className="label">Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("1")}
                className={`rounded-xl border-2 py-2.5 text-sm font-semibold transition-colors ${
                  type === "1" ? "border-accent-500 bg-accent-50 text-accent-800" : "border-slate-200 text-slate-500"
                }`}
              >
                Income
              </button>
              <button
                type="button"
                onClick={() => setType("2")}
                className={`rounded-xl border-2 py-2.5 text-sm font-semibold transition-colors ${
                  type === "2" ? "border-rose-400 bg-rose-50 text-rose-700" : "border-slate-200 text-slate-500"
                }`}
              >
                Expense
              </button>
            </div>
            <input type="hidden" name="type" value={type} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-amount" className="label">Amount (₹)</label>
              <input
                id="edit-amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                defaultValue={tx.amount}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="edit-date" className="label">Date</label>
              <input id="edit-date" name="date" type="date" required defaultValue={tx.date} className="input" />
            </div>
          </div>

          <div>
            <label htmlFor="edit-category" className="label">Category</label>
            <select
              id="edit-category"
              name={type === "1" ? "income_type_id" : "expense_type_id"}
              className="input"
              required
              defaultValue={
                type === "1"
                  ? (tx.incomeTypeId ?? "")
                  : (tx.expenseTypeId ?? "")
              }
            >
              <option value="" disabled>Select category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-status" className="label">Status</label>
              <select id="edit-status" name="status" className="input" defaultValue={tx.status ?? "pending"}>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="edit-payment" className="label">Payment method</label>
              <select id="edit-payment" name="payment_method" className="input" defaultValue={tx.paymentMethod ?? ""}>
                <option value="">None</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="netbanking">Net banking</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="edit-ref" className="label">Reference no.</label>
            <input
              id="edit-ref"
              name="reference_number"
              className="input"
              placeholder="e.g. UTR / receipt"
              defaultValue={tx.referenceNumber ?? ""}
            />
          </div>

          <div>
            <label htmlFor="edit-desc" className="label">Description</label>
            <input
              id="edit-desc"
              name="description"
              className="input"
              placeholder="What is this for?"
              defaultValue={tx.description ?? ""}
            />
          </div>

          <div>
            <label htmlFor="edit-file" className="label">Attachment (optional)</label>
            <input
              id="edit-file"
              name="file"
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              className="input file-input"
            />
            {tx.filePath && (
              <p className="mt-1 text-xs text-slate-400">
                Current: <a className="text-brand-700 underline" href={`/api/doctor/income-expense/${tx.id}/file`} target="_blank" rel="noreferrer">view file</a> — uploading a new one replaces it.
              </p>
            )}
          </div>

          {state.error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={pending} className="btn-primary flex-1">
              <Pencil className="h-4 w-4" />
              {pending ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}