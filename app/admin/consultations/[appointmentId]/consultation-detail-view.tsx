"use client";

import type { AdminConsultationRecord } from "./actions";

/**
 * Read-only consultation record for the business owner. The clinical
 * completion flow stays with the doctor per the module's stated intent — this
 * view exists so an owner can audit the record without leaving /admin.
 */
export function ConsultationDetailView({ record }: { record: AdminConsultationRecord }) {
  const notes: { label: string; value: string | null }[] = [
    { label: "Symptoms", value: record.symptomsNote },
    { label: "Examination", value: record.examinationNote },
    { label: "Diagnosis", value: record.diagnosisNote },
    { label: "Lab notes", value: record.labNote },
    { label: "Medications", value: record.medicationsNote },
    { label: "Medical history", value: record.medicalHistory },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Patient</dt>
          <dd className="mt-1 text-sm font-semibold text-ink">{record.patientName}</dd>
          {record.patientPhone && <dd className="text-xs text-ink-muted">{record.patientPhone}</dd>}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Treating doctor
          </dt>
          <dd className="mt-1 text-sm font-semibold text-ink">{record.doctorName ?? "—"}</dd>
          {record.consultationDate && (
            <dd className="text-xs text-ink-muted">{record.consultationDate}</dd>
          )}
        </div>
      </dl>

      <div className="space-y-3">
        {notes.map((note) => (
          <section key={note.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {note.label}
            </h2>
            <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
              {note.value?.trim() ? note.value : "—"}
            </p>
          </section>
        ))}
      </div>

      {(record.followUpDate || record.followUpStatus) && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Follow-up</h2>
          <p className="mt-1 text-sm text-ink">
            {record.followUpDate ?? "—"}
            {record.followUpStatus ? ` · ${record.followUpStatus}` : ""}
          </p>
        </div>
      )}
    </div>
  );
}
