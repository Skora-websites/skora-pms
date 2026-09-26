import type { Metadata } from "next";
import Link from "next/link";
import { FileDown, Stethoscope } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getConsultations, resolvePracticeDoctorId } from "@/lib/queries/doctor";
import { listDoctorIdsFor } from "@/lib/queries/clinic";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui/dashboard-ui";
import { ConsultationList } from "@/components/mobile-view/consultations-list";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Consultations · Doctor" };

export default async function ConsultationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireRole(["doctor", "receptionist"]);
  const searchParamsValue = await searchParams;
  const doctorId = resolvePracticeDoctorId(user);
  // Receptionists (and clinic-owner doctors) see the whole practice's history;
  // a member doctor sees strictly their own consultations.
  const doctorIds = await listDoctorIdsFor(user, doctorId);
  const page = Math.max(1, Number.parseInt(searchParamsValue.page ?? "1", 10) || 1);
  const { rows: consultations, hasMore } = await getConsultations(doctorIds, { page });
  const pageParams = (p: number) => (p > 1 ? `/doctor/consultations?page=${p}` : "/doctor/consultations");

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
        <>
          {/* Mobile: card list */}
          <ConsultationList consultations={consultations} />
          {/* Desktop: table */}
          <div className="hidden sm:block">
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
                        <p className="font-medium text-ink">{c.patientName}</p>
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
                          {c.appointmentId && (
                            <Link
                              href={`/doctor/consultations/${c.appointmentId}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-800"
                            >
                              View
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {(page > 1 || hasMore) && (
        <div className="mt-5 flex items-center justify-center gap-3">
          {page > 1 && (
            <Link
              href={pageParams(page - 1)}
              className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-800"
            >
              Previous
            </Link>
          )}
          {hasMore && (
            <Link
              href={pageParams(page + 1)}
              className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-800"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}