import Link from "next/link";
import {
  CalendarDays,
  CalendarClock,
  Users,
  Wallet,
  ArrowUpRight,
  Video,
  Clock,
  CalendarPlus,
  UserPlus,
  Stethoscope,
} from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import {
  getDoctorStats,
  getDoctorFinanceTrend,
  getTodaysAppointments,
  getRecentAppointments,
} from "@/lib/queries/doctor";
import { StatCard, StatusBadge, EmptyState, PageHeader } from "@/components/ui/dashboard-ui";
import { DutyToggle } from "@/components/doctor/duty-toggle";
import { dutyModeOf } from "@/lib/utils";
import { formatINR, formatDate, cn } from "@/lib/utils";

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

/** Tier for the occupancy chart bar styling (DESIGN.md §5.4 Widget A:
    low = hatch, moderate = sage, peak = mint, heavy = deep forest). */
function tierOf(count: number, max: number): "low" | "moderate" | "peak" | "heavy" {
  if (count <= 0) return "low";
  if (count === max) return "peak";
  if (count >= max * 0.75) return "heavy";
  if (count >= max * 0.4) return "moderate";
  return "low";
}

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

  const weekMap = new Map(stats.weekAppointments.map((w) => [w.date, w.count] as const));
  const chartData = DAY_LETTERS.map((letter, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { label: letter, count: weekMap.get(key) ?? 0 };
  });
  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  // SVG geometry — Weekly OPD Occupancy renders in a ~1fr bento card, so the
  // viewBox is sized for that narrow column (280×180) instead of a wide strip.
  const BW_2 = 26;
  const MAX_H_2 = 110;
  const BASE_Y_2 = 150;
  const next = todays[0];

  const queue = (todays.length > 0 ? todays : recent).slice(0, 5);
  // Per-row glyph tints cycling the CRM queue palette (blue/amber/teal/violet/emerald)
  const QUEUE_TINTS = ["#3B82F6", "#F59E0B", "#0EA5E9", "#8B5CF6", "#10B981"];

  return (
    <div>
      <PageHeader
        title="Clinic OS Dashboard"
        subtitle="Real-time practice intelligence and multi-clinic orchestration."
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            {user.role === "doctor" && (
              <DutyToggle
                initialMode={dutyModeOf(user.clinicOnDuty, user.homeVisitOnDuty)}
              />
            )}
            <Link
              href="/doctor/patients/new"
              className="inline-flex items-center gap-2 rounded-full bg-accent-100 px-5 py-2.5 text-[13px] font-semibold text-brand-800 transition-all hover:bg-accent-200 active:scale-[0.98]"
            >
              <UserPlus className="h-4 w-4" />
              Add Patient
            </Link>
            <Link
              href="/doctor/appointments"
              className="btn-primary"
            >
              <CalendarPlus className="h-4 w-4" />
              New Appointment
            </Link>
          </div>
        }
      />

      {/* ── KPI METRIC ROW (DESIGN.md §5.3) ──────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} tone="brand" label="Patients this week" value={stats.weekAppointments.reduce((a, b) => a + b.count, 0)} hint="Appointments in last 7 days" />
        <StatCard icon={CalendarDays} tone="accent" label="Appointments today" value={stats.todayAppointments} hint={`${stats.pendingFollowUps} follow-ups pending`} />
        <StatCard icon={Wallet} tone="amber" label="Monthly billing" value={formatINR(stats.monthIncome)} hint="Integrated billing & I/E synced" />
        <StatCard icon={Users} tone="rose" label="Registered patients" value={stats.totalPatients} hint={`Expenses ${formatINR(stats.monthExpense)}`} />
      </div>

      {/* ── MID BENTO ROW: Occupancy | Next Consultation | Clinical Queue (§5.4) */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_2fr] [&>*]:min-w-0">
        {/* Widget A — Weekly OPD Occupancy (tiered rounded bars with value labels).
            Sized for its ~1fr card: a 280×180 viewBox with preserveAspectRatio
            so bars scale cleanly instead of the old 640-wide chart rendering
            as a thin messed-up strip in the narrow column. */}
        <div className="card flex flex-col p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">Weekly OPD Occupancy</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
              {chartData.reduce((a, d) => a + d.count, 0)} this week
            </span>
          </div>
          <svg
            viewBox="0 0 280 180"
            preserveAspectRatio="xMidYMid meet"
            className="mt-4 max-h-56 w-full flex-1"
            role="img"
            aria-label="Weekly OPD occupancy by day"
          >
            <line x1="0" y1={BASE_Y_2} x2="280" y2={BASE_Y_2} stroke="var(--color-slate-200)" strokeWidth="1" />

            {chartData.map((d, i) => {
              const x = 8 + i * 38;
              const h = d.count > 0 ? Math.max((d.count / maxCount) * MAX_H_2, 10) : 4;
              const y = BASE_Y_2 - h;
              const tier = tierOf(d.count, maxCount);
              const fill =
                tier === "peak" ? "var(--color-accent-500)"
                : tier === "heavy" ? "var(--color-brand-700)"
                : tier === "moderate" ? "var(--color-sage)"
                : d.count > 0 ? "var(--color-slate-300)" : "var(--color-slate-100)";
              return (
                <g key={i}>
                  <rect x={x} y={y} width={BW_2} height={h} rx="6" fill={fill}>
                    <title>{`${d.label}: ${d.count} appointment${d.count === 1 ? "" : "s"}`}</title>
                  </rect>
                  {d.count > 0 && (
                    <text x={x + BW_2 / 2} y={y - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-ink)">
                      {d.count}
                    </text>
                  )}
                  <text x={x + BW_2 / 2} y={BASE_Y_2 + 16} textAnchor="middle" fontSize="11" fontWeight={tier === "peak" ? "700" : "400"} fill="var(--color-slate-500)">
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Widget B — Next Consultation (first of today's schedule + Start) */}
        <div className="card flex flex-col p-6">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">Next Consultation</h2>
          {next ? (
            <>
              <div className="mt-4 flex-1 rounded-2xl border border-slate-200 bg-surface-subtle p-5">
                <h3 className="text-[13px] font-semibold capitalize text-ink">
                  {next.caseType.replace(/_/g, " ")} — {next.patientName}
                </h3>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Time: {next.time}</span>
                </p>
                <div className="mt-3">
                  <StatusBadge status={next.status} />
                </div>
              </div>
              {next.status === "confirmed" || next.status === "pending" ? (
                <Link
                  href={`/doctor/consultations/${next.id}`}
                  className="btn-primary mt-5 justify-center"
                  title="Start consultation"
                >
                  <Video className="h-4 w-4" />
                  Start Consultation
                </Link>
              ) : (
                <Link href="/doctor/consultations" className="btn-secondary mt-5 justify-center">
                  <Stethoscope className="h-4 w-4" />
                  Open Consultations
                </Link>
              )}
            </>
          ) : (
            <>
              <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-surface-subtle px-5 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <CalendarClock className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-semibold text-ink">No consultations today</p>
                <p className="mt-1 text-xs text-slate-400">
                  Your schedule is clear. New bookings will appear here.
                </p>
              </div>
              <Link href="/doctor/appointments" className="btn-secondary mt-5 justify-center">
                <CalendarPlus className="h-4 w-4" />
                Book Appointment
              </Link>
            </>
          )}
        </div>

        {/* Widget C — Clinical Queue (today's schedule; tinted status glyphs) */}
        <div className="card flex flex-col p-6 md:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">Clinical Queue</h2>
            <Link
              href="/doctor/appointments"
              className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-3 py-1.5 text-[11px] font-semibold text-brand-800 transition hover:bg-accent-200"
            >
              + New
            </Link>
          </div>
          <div className="mt-2 flex-1">
            {queue.length === 0 && (
              <p className="hatch rounded-2xl px-4 py-10 text-center text-sm text-slate-400">
                No appointments yet.
              </p>
            )}
            {queue.map((a, qi) => (
              <div key={a.id} className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: `${QUEUE_TINTS[qi % QUEUE_TINTS.length]}1A`, color: QUEUE_TINTS[qi % QUEUE_TINTS.length] }}
                >
                  <Stethoscope className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">{a.patientName}</p>
                  <p className="mt-0.5 truncate text-xs capitalize text-slate-500">
                    {a.caseType.replace(/_/g, " ")} · {a.time}
                  </p>
                </div>
                {a.status === "confirmed" || a.status === "pending" ? (
                  <Link
                    href={`/doctor/consultations/${a.id}`}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-700 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-brand-600"
                    title="Start consultation"
                  >
                    ▶ Start
                  </Link>
                ) : (
                  <StatusBadge status={a.status} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BOTTOM BENTO ROW: Recent Appointments + Ledger Trend (§5.5) ─ */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr] [&>*]:min-w-0">
        {/* Recent appointments */}
        <div className="min-w-0">
          {recent.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No appointments yet"
              description="Book your first appointment to see it here."
              action={{ href: "/doctor/appointments", label: "Book appointment" }}
            />
          ) : (
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4">
                <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">Recent Appointments</h2>
                <Link href="/doctor/appointments" className="group inline-flex items-center gap-1 text-xs font-semibold text-brand-800 hover:text-brand-600">
                  View all <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="border-t border-slate-100">
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
                        <td className="font-semibold text-ink">{a.patientName}</td>
                        <td>{formatDate(a.date)}</td>
                        <td>{a.time}</td>
                        <td className="capitalize">{a.caseType.replace(/_/g, " ")}</td>
                        <td><StatusBadge status={a.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Finance trend chart — dark forest tracker-style card (§5.5 Widget F) */}
        <div className="relative flex flex-col overflow-hidden rounded-3xl border border-transparent bg-forest-deep p-6 text-white shadow-pop">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em]">Income &amp; Expense</h2>
          <p className="text-xs text-white/50">Last 6 months</p>
          <div className="mt-4 flex gap-2" style={{ height: 150 }}>
            {financeTrend.map((m) => (
              <div key={m.label} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex w-full flex-1 items-end gap-0.5">
                  <div
                    className={cn("w-1/2 rounded-t-md transition-all", m.income === 0 ? "hatch opacity-60" : "bg-accent-500")}
                    style={{ height: `${Math.max((m.income / maxFinance) * 100, 3)}%` }}
                    title={`Income ${m.label}: ${formatINR(m.income)}`}
                  />
                  <div
                    className="w-1/2 rounded-t-md bg-rose-400 transition-all"
                    style={{ height: `${Math.max((m.expense / maxFinance) * 100, 3)}%` }}
                    title={`Expense ${m.label}: ${formatINR(m.expense)}`}
                  />
                </div>
                <span className="text-[10px] font-medium tabular-nums text-white/50">
                  {m.label.split("-")[1] ?? m.label}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center gap-6 border-t border-white/10 pt-3 text-xs text-white/70">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-accent-500" /> Income</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-rose-400" /> Expense</span>
          </div>
        </div>
      </div>
    </div>
  );
}
