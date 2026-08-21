import type { Metadata } from "next";
import { FileDown, FileHeart } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getPatientPrescriptions } from "@/lib/queries/patient";
import { PageHeader, EmptyState } from "@/components/ui/dashboard-ui";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Prescriptions · Patient" };
export const dynamic = "force-dynamic";

export default async function PatientPrescriptionsPage() {
  const user = await requireRole(["patient"]);
  const prescriptions = await getPatientPrescriptions(user.id);

  return (
    <div>
      <PageHeader
        title="Prescriptions"
        subtitle="Your digital prescriptions from consultations"
      />

      {prescriptions.length === 0 ? (
        <EmptyState
          icon={FileHeart}
          title="No prescriptions yet"
          description="Prescriptions will appear here after your doctor completes a consultation."
        />
      ) : (
        <div className="space-y-5">
          {prescriptions.map((p) => (
            <div key={p.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 to-accent-600 text-white">
                  <FileHeart className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-sm font-bold text-slate-900">
                    Prescription · {formatDate(p.consultationDate)}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Dr. {p.doctorName}{p.doctorQualification ? ` (${p.doctorQualification})` : ""}
                  </p>
                </div>
                <div className="ml-auto">
                  <a
                    href={`/api/prescriptions/${p.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-800 transition-colors hover:bg-brand-50"
                  >
                    <FileDown className="h-3.5 w-3.5" /> Download PDF
                  </a>
                </div>
              </div>
              <div className="grid gap-5 px-6 py-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Diagnosis</p>
                  <p className="mt-1.5 text-sm text-slate-700">{p.diagnosisNote ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Symptoms</p>
                  <p className="mt-1.5 text-sm text-slate-700">{p.symptomsNote ?? "—"}</p>
                </div>
              </div>
              {p.medications.length > 0 && (
                <div className="border-t border-slate-100 px-6 py-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Medicines</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {p.medications.map((m) => (
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
              {p.followUpDate && (
                <div className="border-t border-slate-100 px-6 py-3">
                  <span className="badge bg-accent-100 text-accent-800">Follow-up {p.followUpDate}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}