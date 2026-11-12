"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import { saveConsultation } from "../../actions";
import { IndiaPicker } from "@/components/integrations/india-picker";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

type MedicationRow = {
  medicineName: string;
  dose: string;
  frequency: string;
  duration: string;
  refills: number;
  note: string;
};

type ExistingConsultation = {
  id: number;
  symptomsNote: string | null;
  examinationNote: string | null;
  diagnosisNote: string | null;
  labNote: string | null;
  medicationsNote: string | null;
  medicalHistory: string | null;
  followUpDate: Date | string | null;
} | null;

type ExistingMedication = {
  id?: number;
  medicineName: string;
  dose: string | null;
  frequency: string | null;
  duration: string | null;
  refills?: number | null;
  note: string | null;
};

const initialState = { error: null as string | null, consultationId: null as number | null };

function appendLine(current: string, addition: string) {
  const t = current.trimEnd();
  return t ? `${t}\n${addition}` : addition;
}

function toDateInputValue(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function toMedRows(meds?: ExistingMedication[]): MedicationRow[] {
  if (!meds || meds.length === 0) return [];
  return meds.map((m) => ({
    medicineName: m.medicineName || "",
    dose: m.dose || "",
    frequency: m.frequency || "",
    duration: m.duration || "",
    refills: typeof m.refills === "number" ? m.refills : 0,
    note: m.note || "",
  }));
}

export function ConsultationForm({
  appointmentId,
  patientId,
  bloodGroup,
  bp,
  weight,
  height,
  existingConsultation,
  existingMedications,
}: {
  appointmentId: number;
  patientId: number | null;
  bloodGroup: string | null;
  bp: string | null;
  weight: string | null;
  height: string | null;
  existingConsultation: ExistingConsultation;
  existingMedications?: ExistingMedication[];
}) {
  const [state, formAction, pending] = useActionState(saveConsultation, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  const [symptoms, setSymptoms] = useState(existingConsultation?.symptomsNote ?? "");
  const [examination, setExamination] = useState(existingConsultation?.examinationNote ?? "");
  const [diagnosis, setDiagnosis] = useState(existingConsultation?.diagnosisNote ?? "");
  const [labTests, setLabTests] = useState(existingConsultation?.labNote ?? "");
  const [medicationsNote, setMedicationsNote] = useState(existingConsultation?.medicationsNote ?? "");
  const [medicalHistory, setMedicalHistory] = useState(existingConsultation?.medicalHistory ?? "");
  const [medRows, setMedRows] = useState<MedicationRow[]>(() => toMedRows(existingMedications));

  if (!patientId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
        This appointment is for a walk-in patient without a registered profile. Add the patient&apos;s
        records from the registrations page first to start a consultation.
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  function addMedRow(name = "") {
    setMedRows((prev) => [
      ...prev,
      { medicineName: name, dose: "", frequency: "", duration: "", refills: 0, note: "" },
    ]);
  }

  function updateMedRow(index: number, patch: Partial<MedicationRow>) {
    setMedRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function removeMedRow(index: number) {
    setMedRows((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <input type="hidden" name="appointment_id" value={appointmentId} />
      <input type="hidden" name="patient_id" value={patientId} />
      <input type="hidden" name="med_count" value={medRows.length} />

      {/* Vitals */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Vitals &amp; Patient info</h3>
        <div className="grid gap-4 sm:grid-cols-4">
          <div>
            <label className="label">Blood group</label>
            <select name="blood_group" className="input" defaultValue={bloodGroup ?? ""}>
              <option value="">—</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">BP (mmHg)</label>
            <input name="bp" type="text" className="input" defaultValue={bp ?? ""} placeholder="120/80" />
          </div>
          <div>
            <label className="label">Weight (kg)</label>
            <input name="weight" type="number" step="0.1" min="0" max="500" className="input" defaultValue={weight ?? ""} placeholder="65.0" />
          </div>
          <div>
            <label className="label">Height (cm)</label>
            <input name="height" type="number" step="0.1" min="0" max="300" className="input" defaultValue={height ?? ""} placeholder="170.0" />
          </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Clinical notes */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Clinical notes</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Symptoms / Chief complaints">
            <div>
              <IndiaPicker
                kind="symptoms"
                onAdd={(t) => setSymptoms((prev) => appendLine(prev, t))}
                placeholder="Search symptoms…"
              />
              <textarea
                name="symptoms_note"
                rows={3}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="input mt-2 resize-none"
                placeholder="Chief complaints…"
              />
            </div>
          </Field>
          <Field label="Examination / Findings">
            <textarea
              name="examination_note"
              rows={3}
              value={examination}
              onChange={(e) => setExamination(e.target.value)}
              className="input resize-none"
              placeholder="Clinical findings, vitals, observations…"
            />
          </Field>
        </div>
        <div className="mt-4">
          <IndiaPicker
            kind="diagnoses"
            onAdd={(t) => setDiagnosis((prev) => appendLine(prev, t))}
            placeholder="Search diagnoses (ICD-10 codes shown)…"
          />
          <div className="mt-2">
            <Field label="Diagnosis">
              <textarea
                name="diagnosis_note"
                rows={3}
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="input resize-none"
                placeholder="Provisional / final diagnosis"
              />
            </Field>
          </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Tests & Medications */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Tests &amp; Medications</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <IndiaPicker
              kind="lab-tests"
              onAdd={(t) => setLabTests((prev) => appendLine(prev, t))}
              placeholder="Search lab tests…"
            />
            <div className="mt-2">
              <Field label="Lab tests / Investigations">
                <textarea
                  name="lab_note"
                  rows={3}
                  value={labTests}
                  onChange={(e) => setLabTests(e.target.value)}
                  className="input resize-none"
                  placeholder="Tests ordered…"
                />
              </Field>
            </div>
          </div>
          <div>
            <Field label="Medical history">
              <textarea
                name="medical_history"
                rows={5}
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                className="input resize-none"
                placeholder="Past illnesses, allergies, ongoing conditions…"
              />
            </Field>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Structured medications</p>
              <p className="text-xs text-slate-400">These are saved as the e-prescription lines and appear in the PDF and patient view.</p>
            </div>
            <button
              type="button"
              onClick={() => addMedRow()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-100"
            >
              <Plus className="h-3.5 w-3.5" /> Add medicine
            </button>
          </div>

          <div className="mb-3">
            <MedicineSearchInput onAdd={(name) => addMedRow(name)} />
          </div>

          {medRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-4 text-sm text-slate-500">
              No structured medications added yet. Use &quot;Add medicine&quot; or search above. You can still add general notes below.
            </div>
          ) : (
            <div className="space-y-3">
              {medRows.map((m, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Medicine {i + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeMedRow(i)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="sm:col-span-2 lg:col-span-1">
                      <label className="label">Medicine name</label>
                      <input
                        type="text"
                        name={`medicine_${i}`}
                        value={m.medicineName}
                        onChange={(e) => updateMedRow(i, { medicineName: e.target.value })}
                        className="input"
                        placeholder="e.g. Amoxicillin 500mg"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Dose</label>
                      <input
                        type="text"
                        name={`dose_${i}`}
                        value={m.dose}
                        onChange={(e) => updateMedRow(i, { dose: e.target.value })}
                        className="input"
                        placeholder="e.g. 1 tablet"
                      />
                    </div>
                    <div>
                      <label className="label">Frequency</label>
                      <input
                        type="text"
                        name={`frequency_${i}`}
                        value={m.frequency}
                        onChange={(e) => updateMedRow(i, { frequency: e.target.value })}
                        className="input"
                        placeholder="e.g. 3 times daily"
                      />
                    </div>
                    <div>
                      <label className="label">Duration</label>
                      <input
                        type="text"
                        name={`duration_${i}`}
                        value={m.duration}
                        onChange={(e) => updateMedRow(i, { duration: e.target.value })}
                        className="input"
                        placeholder="e.g. 5 days"
                      />
                    </div>
                    <div>
                      <label className="label">Refills allowed</label>
                      <input
                        type="number"
                        name={`refills_${i}`}
                        min={0}
                        max={12}
                        value={m.refills}
                        onChange={(e) => updateMedRow(i, { refills: Number(e.target.value || 0) })}
                        className="input"
                      />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-1">
                      <label className="label">Instructions / note</label>
                      <input
                        type="text"
                        name={`note_${i}`}
                        value={m.note}
                        onChange={(e) => updateMedRow(i, { note: e.target.value })}
                        className="input"
                        placeholder="e.g. after food"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4">
          <Field label="Additional medication notes (optional)">
            <textarea
              name="medications_note"
              rows={3}
              value={medicationsNote}
              onChange={(e) => setMedicationsNote(e.target.value)}
              className="input resize-none"
              placeholder="General prescription notes, advice, or non-structured items…"
            />
          </Field>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Follow-up */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Follow-up</h3>
        <div className="max-w-xs">
          <Field label="Follow-up date (optional)">
            <input
              name="follow_up_date"
              type="date"
              min={today}
              defaultValue={toDateInputValue(existingConsultation?.followUpDate)}
              className="input"
            />
          </Field>
        </div>
      </div>

      {state.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
      )}
      {state.consultationId && (
        <p className="rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-800">
          ✓ Consultation saved and appointment marked as completed.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-6">
        <button type="submit" disabled={pending} className="btn-primary !rounded-xl !px-6 !py-3">
          <Save className="h-4 w-4" />
          {pending ? "Saving…" : "Save consultation"}
        </button>
        <Link
          href="/doctor/appointments"
          className="inline-flex items-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
        >
          Back to appointments
        </Link>
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

function MedicineSearchInput({ onAdd }: { onAdd: (name: string) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: number; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(value: string) {
    setQuery(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/medicines?q=${encodeURIComponent(value.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults((data.medicines ?? []).slice(0, 8));
          setOpen(true);
        } else {
          setResults([]);
          setOpen(false);
        }
      } catch {
        setResults([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  return (
    <div className="relative max-w-xl">
      <label className="label">Search medicine to add</label>
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onFocus={() => { if (results.length > 0) setOpen(true); }}
        className="input"
        placeholder="Type to search medicines, then click to add…"
      />
      {open && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {loading && <li className="px-3 py-2 text-sm text-slate-400">Searching…</li>}
          {!loading && results.length === 0 && (
            <li className="px-3 py-2 text-sm text-slate-400">No medicines found</li>
          )}
          {!loading &&
            results.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onAdd(m.name);
                    setQuery("");
                    setResults([]);
                    setOpen(false);
                  }}
                  className="flex w-full items-center px-3 py-2 text-left text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-800"
                >
                  {m.name}
                </button>
              </li>
            ))}
        </ul>
      )}
      <p className="mt-1.5 text-xs text-slate-400">
        Adds a structured medication row. You can also add a blank row and type the medicine name manually.
      </p>
    </div>
  );
}