import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { requireAdminTier } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { getTransactions } from "@/lib/queries/doctor";
import { PageHeader, EmptyState } from "@/components/ui/dashboard-ui";
import { TransactionForm } from "@/app/doctor/income-expense/transaction-form";
import { TransactionRowActions } from "@/app/doctor/income-expense/transaction-row-actions";
import { CategoryManager } from "@/app/doctor/income-expense/category-manager";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Income & Expense · Business" };
export const dynamic = "force-dynamic";

/**
 * Admin-tier ledger: full transaction CRUD (create / edit / status / delete)
 * plus income & expense category management across the whole business. The
 * shared doctor actions enforce the write scope server-side.
 */
export default async function AdminIncomeExpensePage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requireAdminTier("/admin/income-expense");
  const scope = await getBusinessScope();
  const { period } = await searchParams;
  const safePeriod = period === "month" || period === "last_month" ? period : "all";

  const { rows, incomeTotal, expenseTotal, incomeTypes, expenseTypes } = await getTransactions(
    scope.doctorIds,
    safePeriod,
    { page: 1, pageSize: 50 }
  );

  return (
    <div>
      <PageHeader
        title="Income & Expense"
        subtitle="Ledger across every clinic in your business"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Income</p>
          <p className="mt-1 text-xl font-bold text-brand-800">{formatINR(incomeTotal)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Expense</p>
          <p className="mt-1 text-xl font-bold text-rose-600">{formatINR(expenseTotal)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Net</p>
          <p className="mt-1 text-xl font-bold text-ink">{formatINR(incomeTotal - expenseTotal)}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          {rows.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No transactions yet"
              description="Income and expense entries recorded here or by your teams will appear here."
            />
          ) : (
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.id}>
                      <td className="text-slate-500">{formatDate(t.date)}</td>
                      <td className="text-ink">{t.description ?? "—"}</td>
                      <td className="text-slate-500">
                        {t.incomeType ?? t.expenseType ?? "—"}
                      </td>
                      <td
                        className={`font-semibold ${
                          t.type === 1 ? "text-brand-800" : "text-rose-600"
                        }`}
                      >
                        {t.type === 1 ? "+" : "−"}
                        {formatINR(Number(t.amount))}
                      </td>
                      <td className="text-right">
                        <TransactionRowActions
                          tx={t}
                          incomeTypes={incomeTypes}
                          expenseTypes={expenseTypes}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-6">
          <TransactionForm incomeTypes={incomeTypes} expenseTypes={expenseTypes} />
          <CategoryManager incomeTypes={incomeTypes} expenseTypes={expenseTypes} />
        </div>
      </div>
    </div>
  );
}
