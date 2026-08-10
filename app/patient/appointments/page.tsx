import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getPatientAppointments } from "@/lib/queries/patient";
import { PageHeader, StatusBadge, EmptyState } from "@/components/ui/dashboard-ui";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Appointments · Patient" };

export default async function PatientAppointmentsPage() {
  const user = await requireRole(["patient"]);
  const appointments = await getPatientAppointments(user.id);

  return (
    <div>
      <PageHeader
        title="My appointments"
        subtitle={`${appointments.length} appointment${appointments.length === 1 ? "" : "s"} in your history`}
      />

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
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id}>
                  <td>
                    <p className="font-semibold text-slate-900">{a.doctorName}</p>
                    {a.doctorQualification && (
                      <p className="text-xs text-slate-400">{a.doctorQualification}</p>
                    )}
                  </td>
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
  );
}
