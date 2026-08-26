"use client";

import { formatINR, formatDate } from "@/lib/utils";
import { TransactionRowActions } from "@/app/doctor/income-expense/transaction-row-actions";

type Tx = {
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

/**
 * Mobile-only transaction list (rendered < sm, hidden ≥ sm).
 * One card per transaction — no horizontal table scroll.
 */
export function TransactionList({
  rows,
  tone,
  incomeTypes,
  expenseTypes,
}: {
  rows: Tx[];
  tone: "income" | "expense";
  incomeTypes: Category[];
  expenseTypes: Category[];
}) {
  return (
    <div className="space-y-3 sm:hidden">
      {rows.map((r) => (
        <div key={r.id} className="card p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{r.description ?? "—"}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {r.incomeType ?? r.expenseType ?? "—"} · {formatDate(r.date)}
              </p>
            </div>
            <p className={`whitespace-nowrap font-display text-base font-extrabold ${tone === "income" ? "text-accent-700" : "text-rose-600"}`}>
              {tone === "income" ? "+" : "−"}{formatINR(r.amount)}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-end border-t border-slate-100 pt-2.5">
            <TransactionRowActions
              tx={r}
              incomeTypes={incomeTypes}
              expenseTypes={expenseTypes}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
