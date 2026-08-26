import type { Metadata } from "next";
import Link from "next/link";
import { CalendarPlus, CalendarDays } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getAppointments } from "@/lib/queries/doctor";
import { PageHeader, StatusBadge, EmptyState } from "@/components/ui/dashboard-ui";
import { AppointmentRowActions } from "@/components/doctor/appointment-actions";
import { AppointmentList } from "@/components/mobile-view/appointments-list";
import { ExportAppointmentsButton } from "./export-button";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Appointments · Doctor" };

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; date?: string }>;
}) {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
  const params = await searchParams;
  const filter = { status: params.status ?? "all", date: params.date };

  const appointments = await getAppointments(doctorId, filter);

  const tabs = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "pending_consent", label: "Pending consent" },
    { key: "confirmed", label: "Confirmed" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <div>
      <PageHeader
        title="Appointments"
        subtitle={`${appointments.length} appointment${appointments.length === 1 ? "" : "s"} found`}
        action={
          <div className="flex items-center gap-2">
            <ExportAppointmentsButton status={params.status} />
            <Link
              href="/doctor/appointments/book"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-700 to-accent-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-700/20 transition-all hover:-translate-y-0.5"
            >
              <CalendarPlus className="h-4 w-4" />
              Book appointment
            </Link>
          </div>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/doctor/appointments?status=${t.key}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              (filter.status ?? "all") === t.key
                ? "bg-navy-950 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-800"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {appointments.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No appointments here"
          description="Try a different filter or book a new appointment."
          action={{ href: "/doctor/appointments/book", label: "Book appointment" }}
        />
      ) : (
        <>
          {/* Mobile: card list (no table scroll) */}
          <AppointmentList appointments={appointments} />
          {/* Desktop: full table */}
          <div className="hidden sm:block">
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Visit type</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <p className="font-semibold text-slate-900">{a.patientName}</p>
                        <p className="text-xs text-slate-400">{a.mobileNumber ?? a.patientPhone ?? ""}</p>
                      </td>
                      <td>{formatDate(a.date)}</td>
                      <td>{a.time}</td>
                      <td className="capitalize">{a.caseType.replace(/_/g, " ")}</td>
                      <td><StatusBadge status={a.status} /></td>
                      <td className="text-right">
                        <AppointmentRowActions appointmentId={a.id} status={a.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
