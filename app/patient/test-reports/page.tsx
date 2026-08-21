import type { Metadata } from "next";
import { FileDown, FlaskConical } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getPatientTestBookings } from "@/lib/queries/patient";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui/dashboard-ui";
import { formatDate } from "@/lib/utils";
import { AiSummaryButton } from "./ai-summary";

export const metadata: Metadata = { title: "Test Reports · Patient" };
export const dynamic = "force-dynamic";

type TestItem = { id: number; name: string; price?: number };

export default async function PatientTestReportsPage() {
  const user = await requireRole(["patient"]);
  const bookings = await getPatientTestBookings(user.id);

  return (
    <div>
      <PageHeader
        title="Test reports"
        subtitle="Lab reports from your test bookings"
      />

      {bookings.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="No test reports yet"
          description="When your doctor books lab tests for you, the uploaded reports will appear here."
        />
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const tests = (b.tests as TestItem[] | null) ?? [];
            const testNames = tests.map((t) => t.name).filter(Boolean).join(", ");
            return (
              <div key={b.id} className="card overflow-hidden">
                <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 to-accent-600 text-white">
                    <FlaskConical className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="font-display text-sm font-bold text-slate-900">
                      {testNames || `Booking #${b.id}`}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Dr. {b.doctorName}{b.vendorName ? ` · ${b.vendorName}` : ""} · {formatDate(b.bookingDate)}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <StatusBadge status={b.status} />
                    {b.uploadedFilePath && (
                      <>
                        <AiSummaryButton bookingId={b.id} reportName={testNames || `report-${b.id}`} />
                        <a
                          href={`/api/patient/test-reports/${b.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-800 transition-colors hover:bg-brand-50"
                        >
                          <FileDown className="h-3.5 w-3.5" /> View report
                        </a>
                      </>
                    )}
                  </div>
                </div>
                {!b.uploadedFilePath && (
                  <p className="px-6 py-4 text-sm text-slate-400">
                    Report not uploaded yet.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}