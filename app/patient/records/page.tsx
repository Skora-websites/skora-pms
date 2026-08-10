import type { Metadata } from "next";
import { FileDown, FileHeart } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getPatientConsultations } from "@/lib/queries/patient";
import { PageHeader, EmptyState } from "@/components/ui/dashboard-ui";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Health Records · Patient" };

export default async function PatientRecordsPage() {
  const user = await requireRole(["patient"]);
  const consultations = await getPatientConsultations(user.id);

  return (
    <div>
      <PageHeader
        title="Health records"
        subtitle="Your consultation history and prescriptions"
      />

      {consultations.length === 0 ? (
        <EmptyState
          icon={FileHeart}
          title="No records yet"
          description="Your diagnosis and prescriptions will appear here after your first consultation."
        />
      ) : (
        <div className="space-y-5">
          {consultations.map((c) => (
            <div key={c.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 to-accent-600 text-white">
                  <FileHeart className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-sm font-bold text-slate-900">
                    Consultation · {formatDate(c.consultationDate)}
                  </h2>
                  <p className="text-xs text-slate-400">with {c.doctorName}</p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <a
                    href={`/api/prescriptions/${c.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-800 transition-colors hover:bg-brand-50"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    Download PDF
                  </a>
                  {c.followUpDate && (
                    <span className="badge bg-accent-100 text-accent-800">Follow-up {c.followUpDate}</span>
                  )}
                </div>
              </div>
              <div className="grid gap-5 px-6 py-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Diagnosis</p>
                  <p className="mt-1.5 text-sm text-slate-700">{c.diagnosisNote ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Symptoms</p>
                  <p className="mt-1.5 text-sm text-slate-700">{c.symptomsNote ?? "—"}</p>
                </div>
              </div>
              {c.medications.length > 0 && (
                <div className="border-t border-slate-100 px-6 py-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Prescribed medicines</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {c.medications.map((m) => (
                      <div key={m.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                        <span className="text-sm font-semibold text-slate-900">{m.medicineName}</span>
                        <span className="text-xs text-slate-500">
                          {[m.dose, m.frequency, m.duration].filter(Boolean).join(" · ") || "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
