import Link from "next/link";
import {
  CalendarDays,
  Users,
  PhoneCall,
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

  // SVG geometry (mirrors the Weekly OPD Occupancy widget: 640×210 viewBox)
  const BW = 44;
  const GAP = (640 - 7 * BW) / 8;
  const MAX_H = 140;
  const BASE_Y = 160;
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
        {/* Widget A — Weekly OPD Occupancy (tiered SVG bars with peak tooltip) */}
        <div className="card flex flex-col p-6">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">Weekly OPD Occupancy</h2>
          <svg
            viewBox="0 0 640 210"
            className="mt-4 w-full flex-1"
            role="img"
            aria-label="Weekly OPD occupancy by day"
          >
            <defs>
              <pattern id="barHatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="6" height="6" fill="var(--color-brand-50)" />
                <line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-slate-300)" strokeWidth="3" />
              </pattern>
            </defs>

            <line x1="0" y1={BASE_Y} x2="640" y2={BASE_Y} stroke="var(--color-slate-200)" strokeWidth="1" />

            {chartData.map((d, i) => {
              const x = GAP + i * (BW + GAP);
              const h = Math.max((d.count / maxCount) * MAX_H, 6);
              const y = BASE_Y - h;
              const tier = tierOf(d.count, maxCount);
              const fill =
                tier === "peak" ? "var(--color-accent-500)"
                : tier === "heavy" ? "var(--color-brand-700)"
                : tier === "moderate" ? "var(--color-sage)" : "url(#barHatch)";
              const boldDay = tier === "peak" || tier === "heavy";
              return (
                <g key={i}>
                  <rect x={x} y={y} width={BW} height={h} rx="8" fill={fill}>
                    <title>{`${d.count} appointment${d.count === 1 ? "" : "s"}`}</title>
                  </rect>
                  {tier === "peak" && (
                    <g>
                      <rect x={x + BW / 2 - 62} y={y - 34} width="124" height="24" rx="12" fill="var(--color-brand-700)" />
                      <path d={`M ${x + BW / 2 - 5} ${y - 10} L ${x + BW / 2 + 5} ${y - 10} L ${x + BW / 2} ${y - 4} Z`} fill="var(--color-brand-700)" />
                      <text x={x + BW / 2} y={y - 18} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--color-brand-50)">
                        {d.count} Peak Day
                      </text>
                    </g>
                  )}
                  <text x={x + BW / 2} y="186" textAnchor="middle" fontSize="12" fontWeight={boldDay ? "700" : "400"} fill="var(--color-slate-500)">
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
              <div className="hatch mt-4 flex-1 rounded-2xl px-5 py-10 text-center text-sm text-slate-400">
                No consultations scheduled today.
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
