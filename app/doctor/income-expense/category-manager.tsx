"use client";

import { useActionState, useState } from "react";
import { Pencil, Plus, Tag, Trash2 } from "lucide-react";
import {
  createIncomeType,
  createExpenseType,
  updateIncomeType,
  updateExpenseType,
  deleteIncomeType,
  deleteExpenseType,
} from "./actions";

type Category = { id: number; name: string };

const initialState = { error: null as string | null };

export function CategoryManager({
  incomeTypes,
  expenseTypes,
}: {
  incomeTypes: Category[];
  expenseTypes: Category[];
}) {
  const [tab, setTab] = useState<"income" | "expense">("income");
  const categories = tab === "income" ? incomeTypes : expenseTypes;

  const [createState, createAction, createPending] = useActionState(
    tab === "income" ? createIncomeType : createExpenseType,
    initialState
  );
  const [editing, setEditing] = useState<Category | null>(null);
  const [editState, editAction, editPending] = useActionState(
    tab === "income" ? updateIncomeType : updateExpenseType,
    initialState
  );

  const handleDelete = async (id: number) => {
    if (!window.confirm("Deactivate this category? Existing entries keep their category.")) return;
    if (tab === "income") await deleteIncomeType(id);
    else await deleteExpenseType(id);
  };

  if (editing) {
    return (
      <div className="card p-7">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">Edit {tab} category</h2>
            <p className="text-xs text-slate-400">Update the category name.</p>
          </div>
          <button type="button" onClick={() => setEditing(null)} className="btn-secondary !py-2 !px-3 text-xs">
            Cancel
          </button>
        </div>
        <form action={editAction} className="space-y-4">
          <input type="hidden" name="id" value={editing.id} />
          <div>
            <label htmlFor="cat-edit-name" className="label">Name</label>
            <input id="cat-edit-name" name="name" className="input" required defaultValue={editing.name} />
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
          <h2 className="font-display text-base font-bold text-slate-900">Categories</h2>
          <p className="text-xs text-slate-400">Income & expense categories used in the ledger.</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => { setTab("income"); setEditing(null); }}
          className={`rounded-xl border-2 py-2.5 text-sm font-semibold transition-colors ${
            tab === "income" ? "border-accent-500 bg-accent-50 text-accent-800" : "border-slate-200 text-slate-500 hover:border-slate-300"
          }`}
        >
          Income
        </button>
        <button
          type="button"
          onClick={() => { setTab("expense"); setEditing(null); }}
          className={`rounded-xl border-2 py-2.5 text-sm font-semibold transition-colors ${
            tab === "expense" ? "border-rose-400 bg-rose-50 text-rose-700" : "border-slate-200 text-slate-500 hover:border-slate-300"
          }`}
        >
          Expense
        </button>
      </div>

      <form action={createAction} className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <div>
          <label htmlFor="cat-name" className="label">New {tab} category</label>
          <input id="cat-name" name="name" className="input" required placeholder="e.g. Petty cash, Rent" />
        </div>
        {createState.error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{createState.error}</p>
        )}
        <button type="submit" disabled={createPending} className="btn-secondary w-full !py-2.5 text-xs">
          <Plus className="h-4 w-4" />
          {createPending ? "Adding..." : `Add ${tab} category`}
        </button>
      </form>

      <ul className="mt-5 divide-y divide-slate-100">
        {categories.length === 0 && (
          <li className="py-6 text-center text-sm text-slate-400">
            No {tab} categories yet. Add your first one above.
          </li>
        )}
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 py-3">
            <p className="text-sm font-semibold text-slate-900">{c.name}</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setEditing(c)}
                title="Edit"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-brand-800"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(c.id)}
                title="Deactivate"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}