import type { Metadata } from "next";
import Link from "next/link";
import { FileDown, Stethoscope } from "lucide-react";
import { requireAdminTier } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { getConsultations } from "@/lib/queries/doctor";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui/dashboard-ui";
import { ConsultationList } from "@/components/mobile-view/consultations-list";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Consultations · Business" };

/**
 * Business-owner consultations (D1 owner-parity): read-only history of all
 * patient consultations across the business's doctors. Starting a
 * consultation (the clinical completion flow) stays with the doctor — the
 * owner audits records and downloads prescription PDFs.
 */
export default async function AdminConsultationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdminTier("/admin/consultations");
  const scope = await getBusinessScope();
  const searchParamsValue = await searchParams;
  const page = Math.max(1, Number.parseInt(searchParamsValue.page ?? "1", 10) || 1);
  const { rows: consultations, hasMore } = await getConsultations(scope.doctorIds, { page });
  const pageParams = (p: number) => (p > 1 ? `/admin/consultations?page=${p}` : "/admin/consultations");

  return (
    <div>
      <PageHeader
        title="Consultations"
        subtitle="Patient consultation and prescription history across your business"
      />

      {consultations.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No consultations yet"
          description="Completed consultations at your clinics will appear here."
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
                        <a
                          href={`/api/prescriptions/${c.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-800"
                        >
                          <FileDown className="h-3.5 w-3.5" />
                          PDF
                        </a>
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
