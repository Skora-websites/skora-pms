"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Save } from "lucide-react";
import { saveConsultation } from "../../actions";

const initialState = { error: null as string | null, consultationId: null as number | null };

export function ConsultationForm({
  appointmentId,
  patientId,
  hasPatient,
}: {
  appointmentId: number;
  patientId: number;
  hasPatient: boolean;
}) {
  const [state, formAction, pending] = useActionState(saveConsultation, initialState);
  const today = new Date().toISOString().slice(0, 10);

  if (!hasPatient) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
        This appointment is for a walk-in patient without a registered profile. Add the patient&apos;s
        records from the registrations page first to start a consultation.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="appointment_id" value={appointmentId} />
      <input type="hidden" name="patient_id" value={patientId} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Symptoms & complaints">
          <textarea name="symptoms_note" rows={3} className="input resize-none" placeholder="Chief complaints…" />
        </Field>
        <Field label="Examination findings">
          <textarea name="examination_note" rows={3} className="input resize-none" placeholder="Clinical findings…" />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Diagnosis">
          <textarea name="diagnosis_note" rows={3} className="input resize-none" placeholder="Provisional / final diagnosis…" />
        </Field>
        <Field label="Lab tests advised">
          <textarea name="lab_note" rows={3} className="input resize-none" placeholder="Tests to be done…" />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Medical history">
          <textarea name="medical_history" rows={3} className="input resize-none" placeholder="Past illnesses, allergies, ongoing medications…" />
        </Field>
        <Field label="Medications note">
          <textarea name="medications_note" rows={3} className="input resize-none" placeholder="General medication instructions…" />
        </Field>
      </div>

      <Field label="Prescribed medicines (one per line)">
        <textarea
          name="medications"
          rows={4}
          className="input resize-none font-mono text-sm"
          placeholder={"Paracetamol 500mg – 1 tab × 3 times a day – 5 days\nCetirizine 10mg – 1 tab at night – 5 days"}
        />
      </Field>

      <Field label="Follow-up date (optional)">
        <input name="follow_up_date" type="date" min={today} className="input" />
      </Field>

      {state.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
      )}
      {state.consultationId && (
        <p className="rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-800">
          ✓ Consultation saved and appointment marked as completed.
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <Link href="/doctor/appointments" className="btn-secondary">
          Cancel
        </Link>
        <button type="submit" disabled={pending} className="btn-primary">
          <Save className="h-4 w-4" />
          {pending ? "Saving…" : "Save consultation"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
