import type { Metadata } from "next";
import Link from "next/link";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getTransactions } from "@/lib/queries/doctor";
import { PageHeader, EmptyState } from "@/components/ui/dashboard-ui";
import { TransactionForm } from "./transaction-form";
import { TransactionRowActions } from "./transaction-row-actions";
import { CategoryManager } from "./category-manager";
import { formatINR, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Income & Expense · Doctor" };
export const dynamic = "force-dynamic";

const PERIODS = [
  { key: "all", label: "All time" },
  { key: "month", label: "This month" },
  { key: "last_month", label: "Last month" },
] as const;

type Period = (typeof PERIODS)[number]["key"];

export default async function IncomeExpensePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
  const { period: periodRaw } = await searchParams;
  const period: Period = periodRaw === "month" || periodRaw === "last_month" ? periodRaw : "all";
  const { rows, incomeTypes, expenseTypes } = await getTransactions(doctorId, period);

  const income = rows.filter((r) => r.type === 1);
  const expense = rows.filter((r) => r.type === 2);
  const incomeTotal = income.reduce((s, r) => s + Number(r.amount), 0);
  const expenseTotal = expense.reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div>
      <PageHeader
        title="Income & Expense"
        subtitle="Unified ledger for your practice finances"
        action={
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
            {PERIODS.map((p) => (
              <Link
                key={p.key}
                href={p.key === "all" ? "/doctor/income-expense" : `/doctor/income-expense?period=${p.key}`}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  period === p.key ? "bg-navy-950 text-white" : "text-slate-500 hover:text-brand-800"
                )}
              >
                {p.label}
              </Link>
            ))}
          </div>
        }
      />

      <div className="mb-6 grid gap-5 sm:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total income</p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-100 text-accent-700">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-display text-2xl font-extrabold text-accent-700">{formatINR(incomeTotal)}</p>
          <p className="mt-1 text-xs text-slate-400">{income.length} transactions</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total expenses</p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <TrendingDown className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 font-display text-2xl font-extrabold text-rose-600">{formatINR(expenseTotal)}</p>
          <p className="mt-1 text-xs text-slate-400">{expense.length} transactions</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Net position</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-slate-900">
            {formatINR(incomeTotal - expenseTotal)}
          </p>
          <p className="mt-1 text-xs text-slate-400">Income − expenses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          <TransactionTable
            title="Recent income"
            rows={income}
            tone="income"
            period={period}
            incomeTypes={incomeTypes}
            expenseTypes={expenseTypes}
          />
          <TransactionTable
            title="Recent expenses"
            rows={expense}
            tone="expense"
            period={period}
            incomeTypes={incomeTypes}
            expenseTypes={expenseTypes}
          />
        </div>

        <div className="min-w-0 space-y-6">
          <TransactionForm incomeTypes={incomeTypes} expenseTypes={expenseTypes} />
          <CategoryManager incomeTypes={incomeTypes} expenseTypes={expenseTypes} />
        </div>
      </div>
    </div>
  );
}

function TransactionTable({
  title,
  rows,
  tone,
  period,
  incomeTypes,
  expenseTypes,
}: {
  title: string;
  rows: Awaited<ReturnType<typeof getTransactions>>["rows"];
  tone: "income" | "expense";
  period: Period;
  incomeTypes: { id: number; name: string }[];
  expenseTypes: { id: number; name: string }[];
}) {
  if (rows.length === 0) {
    return (
      <div>
        <h2 className="mb-3 font-display text-base font-bold text-slate-900">{title}</h2>
        <EmptyState
          icon={tone === "income" ? TrendingUp : TrendingDown}
          title="Nothing here yet"
          description="Add your first entry using the form."
        />
      </div>
    );
  }
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="min-w-0 truncate font-display text-base font-bold text-slate-900">{title}</h2>
        <a
          href={`/api/doctor/income-expense/export?type=${tone}&period=${period}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-800"
        >
          <Download className="h-3.5 w-3.5" />
          Export {tone}
        </a>
      </div>
      <div className="table-shell">
        <table className="data-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Category</th>
              <th>Date</th>
              <th className="text-right">Amount</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="font-medium text-slate-900">{r.description ?? "—"}</td>
                <td className="text-slate-500">{r.incomeType ?? r.expenseType ?? "—"}</td>
                <td>{formatDate(r.date)}</td>
                <td
                  className={`text-right font-semibold ${
                    tone === "income" ? "text-accent-700" : "text-rose-600"
                  }`}
                >
                  {tone === "income" ? "+" : "−"}{formatINR(r.amount)}
                </td>
                <td>
                  <TransactionRowActions
                    tx={r}
                    incomeTypes={incomeTypes}
                    expenseTypes={expenseTypes}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
