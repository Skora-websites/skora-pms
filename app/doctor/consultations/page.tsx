import type { Metadata } from "next";
import Link from "next/link";
import { FileDown, Stethoscope } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getConsultations } from "@/lib/queries/doctor";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui/dashboard-ui";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Consultations · Doctor" };

export default async function ConsultationsPage() {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
  const consultations = await getConsultations(doctorId);

  return (
    <div>
      <PageHeader
        title="Consultations"
        subtitle="History of all patient consultations and prescriptions"
      />

      {consultations.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No consultations yet"
          description="Completed consultations will appear here with their prescription PDFs."
        />
      ) : (
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Date</th>
                <th>Diagnosis</th>
                <th>Follow-up</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {consultations.map((c) => (
                <tr key={c.id}>
                  <td>
                    <p className="font-medium text-slate-900">{c.patientName}</p>
                    <p className="text-xs text-slate-400">
                      {c.patientPhone ?? c.patientRegistrationId ?? `#${c.patientId}`}
                    </p>
                  </td>
                  <td>{formatDate(c.consultationDate)}</td>
                  <td className="max-w-[220px] truncate text-slate-500">
                    {c.diagnosisNote ?? "—"}
                  </td>
                  <td>
                    {c.followUpDate ? (
                      <div>
                        <span className="text-xs text-slate-500">{c.followUpDate}</span>
                        <StatusBadge status={c.followUpStatus} />
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/api/prescriptions/${c.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-800"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        PDF
                      </a>
                      <Link
                        href={`/doctor/consultations/${c.appointmentId ?? "0"}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-800"
                      >
                        View
                      </Link>
                    </div>
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