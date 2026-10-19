import Link from "next/link";
import { CalendarDays, CalendarPlus, CheckCircle2, ClipboardList, Stethoscope, Users } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import {
  getTodaysAppointments,
  getRecentAppointments,
  getPracticeTodaysAppointments,
  getPracticeRecentAppointments,
  resolvePracticeDoctorId,
  isPracticeWideUser,
} from "@/lib/queries/doctor";
import { getPracticeDoctorIds } from "@/lib/queries/clinic";
import { getDashboardStats } from "@/lib/queries/analytics";
import { StatusBadge, EmptyState } from "@/components/ui/dashboard-ui";
import { timeGreeting, formatDate, firstName } from "@/lib/utils";

/**
 * Doctor dashboard — personal greeting, a self-scoped KPI strip (own numbers
 * only, per the D4 privacy rule; receptionists see their practice's counts),
 * and the doctor's appointments (today's schedule first, recent bookings as
 * fallback). The full "Clinic OS" operational dashboard (KPIs, occupancy,
 * finance charts, clinical queue) lives on the clinic-manager/owner
 * overview at /admin.
 */
export default async function DoctorDashboardPage() {
  const user = await requireRole(["doctor", "receptionist"]);
  const doctorId = resolvePracticeDoctorId(user);
  // Receptionists see the whole practice's queue; doctors see their own.
  const isReceptionist = isPracticeWideUser(user.role);
  const practiceIds = isReceptionist ? await getPracticeDoctorIds(doctorId) : [];
  const statsScope = isReceptionist ? practiceIds : [user.id];

  const [todays, recent, stats] = await Promise.all([
    isReceptionist
      ? getPracticeTodaysAppointments(practiceIds)
      : getTodaysAppointments(doctorId),
    isReceptionist
      ? getPracticeRecentAppointments(practiceIds, 6)
      : getRecentAppointments(doctorId, 6),
    getDashboardStats(statsScope),
  ]);

  const kpis = [
    {
      icon: CalendarDays,
      label: isReceptionist ? "Appointments today" : "My appointments today",
      value: stats.todayCount,
    },
    {
      icon: CheckCircle2,
      label: "Completed this week",
      value: stats.completedWeek,
    },
    {
      icon: ClipboardList,
      label: "Follow-ups due",
      value: stats.followUpsDue,
    },
    {
      icon: Users,
      label: isReceptionist ? "Practice patients" : "My patients",
      value: stats.totalPatients,
    },
  ];

  return (
    <div>
      {/* ── Greeting ──────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="font-display text-[22px] font-bold tracking-[-0.02em] text-ink sm:text-[26px]">
          {timeGreeting()}, {firstName(user.name)}
        </h1>
        <p className="mt-1 text-[12px] text-slate-500">
          Here is your schedule for today.
        </p>
      </div>

      {/* ── KPI strip (self-scoped tallies) ───────────────────────────── */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="card p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">{k.label}</p>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-100 text-brand-700">
                <k.icon className="h-3.5 w-3.5" />
              </span>
            </div>
            <p className="mt-1 font-display text-[26px] font-bold leading-8 tracking-[-0.02em] tabular-nums text-ink">
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Today's appointments (Clinical Queue) ─────────────────────── */}
      <div className="card flex flex-col p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">
            Today&apos;s Appointments
          </h2>
          <Link
            href="/doctor/appointments"
            className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-3 py-1.5 text-[11px] font-semibold text-brand-800 transition hover:bg-accent-200"
          >
            View all
          </Link>
        </div>
        <div className="mt-2">
          {todays.length === 0 && (
            <p className="hatch rounded-2xl px-4 py-10 text-center text-sm text-slate-400">
              No appointments today. Your schedule is clear.
            </p>
          )}
          {todays.map((a) => (
            <div key={a.id} className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Stethoscope className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-ink">{a.patientName}</p>
                <p className="mt-0.5 truncate text-xs capitalize text-slate-500">
                  {a.caseType.replace(/_/g, " ")} · {a.time}
                </p>
              </div>
              <StatusBadge status={a.status} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent appointments ───────────────────────────────────────── */}
      <div className="mt-4">
        {recent.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No appointments yet"
            description={
              user.role === "doctor"
                ? "Appointments booked by reception will appear here."
                : "Book your first appointment to see it here."
            }
            action={
              user.role === "doctor"
                ? undefined
                : { href: "/doctor/appointments/book", label: "Book appointment" }
            }
          />
        ) : (
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">Recent Appointments</h2>
              <Link href="/doctor/appointments" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-800 hover:text-brand-600">
                View all
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

      {/* Quick booking shortcut — staff tier only (doctors never book). */}
      {user.role !== "doctor" && (
        <div className="mt-6 flex justify-center">
          <Link href="/doctor/appointments/book" className="btn-secondary">
            <CalendarPlus className="h-4 w-4" />
            Book appointment
          </Link>
        </div>
      )}
    </div>
  );
}
