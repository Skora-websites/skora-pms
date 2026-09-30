import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, CalendarPlus, CheckCircle2 } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getPatientAppointments } from "@/lib/queries/patient";
import { PageHeader, StatusBadge, EmptyState } from "@/components/ui/dashboard-ui";
import { formatDate } from "@/lib/utils";
import { CancelAppointmentButton } from "./cancel-appointment-button";

export const metadata: Metadata = { title: "Appointments · Patient" };
export const dynamic = "force-dynamic";

export default async function PatientAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const user = await requireRole(["patient"]);
  const [appointments, params] = await Promise.all([
    getPatientAppointments(user.id),
    searchParams,
  ]);
  const justCreated = params.created === "1";

  return (
    <div>
      <PageHeader
        title="My appointments"
        subtitle={`${appointments.length} appointment${appointments.length === 1 ? "" : "s"} in your history`}
        action={
          <Link href="/patient/appointments/book" className="btn-primary">
            <CalendarPlus className="h-4 w-4" />
            Book appointment
          </Link>
        }
      />

      {justCreated && (
        <div
          role="status"
          className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Appointment booked successfully. A confirmation email is on its way.
        </div>
      )}

      {appointments.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No appointments found"
          description="Once your doctor books an appointment for you, it will show up here."
        />
      ) : (
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Doctor</th>
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
                    <p className="font-semibold text-ink">{a.doctorName}</p>
                    {a.doctorQualification && (
                      <p className="text-xs text-slate-400">{a.doctorQualification}</p>
                    )}
                  </td>
                  <td>{formatDate(a.date)}</td>
                  <td>{a.time}</td>
                  <td className="capitalize">{a.caseType.replace(/_/g, " ")}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td className="text-right">
                    {a.status !== "cancelled" && a.status !== "completed" && (
                      <CancelAppointmentButton appointmentId={a.id} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
