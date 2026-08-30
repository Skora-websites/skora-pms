import Link from "next/link";
import {
  CalendarDays,
  Users,
  PhoneCall,
  Wallet,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Clock,
  CalendarPlus,
} from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import {
  getDoctorStats,
  getDoctorFinanceTrend,
  getTodaysAppointments,
  getRecentAppointments,
} from "@/lib/queries/doctor";
import { StatCard, StatusBadge, EmptyState, PageHeader } from "@/components/ui/dashboard-ui";
import { formatINR, formatDate } from "@/lib/utils";

const DAY_LABELS = ["6d", "5d", "4d", "3d", "2d", "1d", "Today"];

export default async function DoctorDashboardPage() {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;

  const [stats, todays, recent, financeTrend] = await Promise.all([
    getDoctorStats(doctorId),
    getTodaysAppointments(doctorId),
    getRecentAppointments(doctorId, 6),
    getDoctorFinanceTrend(doctorId, 6),
  ]);
  const maxFinance = Math.max(...financeTrend.map((m) => Math.max(m.income, m.expense)), 1);

  const weekMap = new Map(
    stats.weekAppointments.map((w) => [new Date(w.date).toDateString(), w.count] as const)
  );
  const chartData = DAY_LABELS.map((label, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return { label, count: weekMap.get(date.toDateString()) ?? 0 };
  });
  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={formatDate(new Date())}
        action={
          <Link
            href="/doctor/appointments"
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-700 to-accent-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-700/20 transition-all hover:-translate-y-0.5"
          >
            <CalendarPlus className="h-4 w-4" />
            New Appointment
          </Link>
        }
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CalendarDays} tone="brand" label="Today's appointments" value={stats.todayAppointments} hint="Across all clinics" />
        <StatCard icon={Users} tone="accent" label="Registered patients" value={stats.totalPatients} hint="Total in your care" />
        <StatCard icon={PhoneCall} tone="amber" label="Pending follow-ups" value={stats.pendingFollowUps} hint="Due for review" />
        <StatCard icon={Wallet} tone="rose" label="Income this month" value={formatINR(stats.monthIncome)} hint={`Expenses ${formatINR(stats.monthExpense)}`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Chart card */}
        <div className="min-w-0">
          <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-slate-900">Appointments — last 7 days</h2>
            <span className="badge bg-accent-100 text-accent-800">{stats.weekAppointments.reduce((a, b) => a + b.count, 0)} total</span>
          </div>
          <div className="mt-6 flex h-48 items-end gap-3">
            {chartData.map((d, i) => (
              <div key={i} className="group flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-bold text-slate-500 opacity-0 transition-opacity group-hover:opacity-100">{d.count}</span>
                <div
                  className="w-full rounded-t-xl bg-gradient-to-t from-brand-700 to-accent-500 transition-all duration-500 group-hover:from-brand-600 group-hover:to-accent-400"
                  style={{ height: `${Math.max((d.count / maxCount) * 100, 4)}%` }}
                />
                <span className="text-[10px] font-medium uppercase text-slate-400">{d.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 text-accent-700">
                <TrendingUp className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs text-slate-400">Income (month)</p>
                <p className="font-display text-lg font-bold text-slate-900">{formatINR(stats.monthIncome)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <TrendingDown className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs text-slate-400">Expenses (month)</p>
                <p className="font-display text-lg font-bold text-slate-900">{formatINR(stats.monthExpense)}</p>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Today's appointments */}
        <div className="min-w-0">
          <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-slate-900">Today&apos;s schedule</h2>
            <Link href="/doctor/appointments" className="text-xs font-semibold text-brand-800 hover:text-brand-600">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {todays.length === 0 && (
              <p className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                No appointments scheduled today.
              </p>
            )}
            {todays.slice(0, 6).map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition-colors hover:border-brand-200 hover:bg-brand-50/40">
                <span className="flex h-11 w-11 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-navy-950 text-white">
                  <Clock className="h-4 w-4 text-accent-400" />
                  <span className="mt-0.5 text-[9px] font-bold leading-none">{a.time.split(" ")[0]}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{a.patientName}</p>
                  <p className="text-xs capitalize text-slate-400">{a.caseType.replace(/_/g, " ")}</p>
                </div>
                {a.status === "confirmed" || a.status === "pending" ? (
                  <Link
                    href={`/doctor/consultations/${a.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-brand-700 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-brand-800"
                    title="Start consultation"
                  >
                    Start
                  </Link>
                ) : (
                  <StatusBadge status={a.status} />
                )}
              </div>
            ))}
          </div>
        </div>
        </div>
        </div>

      {/* Recent appointments */}
      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-slate-900">Recent appointments</h2>
          <Link href="/doctor/appointments" className="group inline-flex items-center gap-1 text-xs font-semibold text-brand-800 hover:text-brand-600">
            View all <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No appointments yet"
            description="Book your first appointment to see it here."
            action={{ href: "/doctor/appointments", label: "Book appointment" }}
          />
        ) : (
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Visit type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((a) => (
                  <tr key={a.id}>
                    <td className="font-semibold text-slate-900">{a.patientName}</td>
                    <td>{formatDate(a.date)}</td>
                    <td>{a.time}</td>
                    <td className="capitalize">{a.caseType.replace(/_/g, " ")}</td>
                    <td><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Finance trend chart */}
      <div className="mt-6">
        <div className="card p-6">
          <h2 className="mb-4 font-display text-base font-bold text-slate-900">Income & Expense — 6 months</h2>
          <div className="flex items-end gap-2" style={{ height: 160 }}>
            {financeTrend.map((m) => (
              <div key={m.label} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex w-full flex-1 gap-0.5">
                  <div
                    className="w-1/2 rounded-t-md bg-accent-500 transition-all"
                    style={{ height: `${Math.max((m.income / maxFinance) * 100, 3)}%` }}
                    title={`Income ${m.label}: ${formatINR(m.income)}`}
                  />
                  <div
                    className="w-1/2 rounded-t-md bg-rose-500 transition-all"
                    style={{ height: `${Math.max((m.expense / maxFinance) * 100, 3)}%` }}
                    title={`Expense ${m.label}: ${formatINR(m.expense)}`}
                  />
                </div>
                <span className="text-[10px] font-medium text-slate-400">
                  {m.label.split("-")[1] ?? m.label}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-accent-500" /> Income</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-rose-500" /> Expense</span>
          </div>
        </div>
      </div>
    </div>
  );
}
