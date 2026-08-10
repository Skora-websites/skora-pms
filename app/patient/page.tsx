import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, CalendarCheck2, FileHeart, Wallet, Stethoscope, ArrowUpRight } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getPatientStats, getPatientAppointments, getPatientConsultations } from "@/lib/queries/patient";
import { StatCard, PageHeader, StatusBadge, EmptyState } from "@/components/ui/dashboard-ui";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard · Patient" };

export default async function PatientDashboardPage() {
  const user = await requireRole(["patient"]);
  const [stats, appointments, consultations] = await Promise.all([
    getPatientStats(user.id),
    getPatientAppointments(user.id),
    getPatientConsultations(user.id),
  ]);

  return (
    <div>
      <PageHeader
        title={`Hello, ${user.name.split(" ")[0]} 👋`}
        subtitle="Here's your health at a glance"
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CalendarDays} tone="brand" label="Upcoming visits" value={stats.upcoming} hint="Scheduled with your doctor" />
        <StatCard icon={CalendarCheck2} tone="accent" label="Completed visits" value={stats.completed} hint="Of all appointments" />
        <StatCard icon={FileHeart} tone="amber" label="Consultations" value={stats.consultations} hint="Records on file" />
        <StatCard icon={Wallet} tone="rose" label="Total billed" value={formatINR(stats.billed)} hint="All time" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Upcoming appointments */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-slate-900">Your appointments</h2>
            <Link href="/patient/appointments" className="group inline-flex items-center gap-1 text-xs font-semibold text-brand-800 hover:text-brand-600">
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {appointments.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No appointments yet"
              description="Your doctor's clinic can book appointments for you, or contact the front desk."
            />
          ) : (
            <div className="space-y-3">
              {appointments.slice(0, 5).map((a) => (
                <div key={a.id} className="card card-hover p-4">
                  <div className="flex items-center gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 to-accent-600 text-white">
                      <Stethoscope className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">
                        {a.doctorName}
                        {a.doctorQualification ? <span className="ml-1 text-xs font-normal text-slate-400">{a.doctorQualification}</span> : null}
                      </p>
                      <p className="text-xs capitalize text-slate-400">
                        {formatDate(a.date)} at {a.time} · {a.caseType.replace(/_/g, " ")}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent consultations */}
        <div>
          <h2 className="mb-4 font-display text-base font-bold text-slate-900">Recent consultations</h2>
          {consultations.length === 0 ? (
            <EmptyState
              icon={FileHeart}
              title="No consultations recorded"
              description="After your first consultation, your diagnosis and medications will appear here."
            />
          ) : (
            <div className="space-y-3">
              {consultations.slice(0, 4).map((c) => (
                <div key={c.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">{formatDate(c.consultationDate)}</p>
                    <span className="badge bg-brand-100 text-brand-800">{c.doctorName}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{c.diagnosisNote ?? c.symptomsNote ?? "Consultation notes"}</p>
                  {c.followUpDate && (
                    <p className="mt-2 text-xs font-medium text-accent-700">Next follow-up: {c.followUpDate}</p>
                  )}
                  {c.medications.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {c.medications.slice(0, 4).map((m) => (
                        <span key={m.id} className="badge bg-slate-100 text-slate-600">{m.medicineName}</span>
                      ))}
                      {c.medications.length > 4 && (
                        <span className="badge bg-slate-100 text-slate-400">+{c.medications.length - 4} more</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
