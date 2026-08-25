"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Save } from "lucide-react";
import { saveConsultation } from "../../actions";

const initialState = { error: null as string | null, consultationId: null as number | null };

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function ConsultationForm({
  appointmentId,
  patientId,
  hasPatient,
  bloodGroup,
  bp,
  weight,
  height,
}: {
  appointmentId: number;
  patientId: number;
  hasPatient: boolean;
  bloodGroup?: string | null;
  bp?: string | null;
  weight?: string | null;
  height?: string | null;
}) {
  const [state, formAction, pending] = useActionState(saveConsultation, initialState);
  const [meds, setMeds] = useState("");
  const today = new Date().toLocaleDateString("en-CA");

  const addMedicine = (name: string) => {
    setMeds((prev) => (prev.trim() ? `${prev.trim()}\n${name}` : name));
  };

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

      {/* ── Vitals ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">Vitals</h3>
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
            <label className="label">BP (e.g., 120/80)</label>
            <input name="bp" type="text" className="input" placeholder="120/80" defaultValue={bp ?? ""} />
          </div>
          <div>
            <label className="label">Weight (kg)</label>
            <input name="weight" type="number" step="0.1" min="0" max="500" className="input" placeholder="70" defaultValue={weight ?? ""} />
          </div>
          <div>
            <label className="label">Height (cm)</label>
            <input name="height" type="number" step="0.1" min="0" max="300" className="input" placeholder="165" defaultValue={height ?? ""} />
          </div>
        </div>
      </div>

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

      {/* ── Medicines (with search) ── */}
      <MedicineSearchInput onAdd={addMedicine} />

      <Field label="Prescribed medicines (one per line)">
        <textarea
          name="medications"
          rows={4}
          value={meds}
          onChange={(e) => setMeds(e.target.value)}
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

function MedicineSearchInput({
  onAdd,
}: {
  onAdd: (name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: number; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const q = query.trim();
    if (q.length < 2) {
      return;
    }
    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/medicines/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = (await res.json()) as { medicines: { id: number; name: string }[] };
          setResults(data.medicines);
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
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query]);

  const pick = (name: string) => {
    onAdd(name);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  return (
    <Field label="Search medicine master">
      <div className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input"
            placeholder="Type to search medicines…"
            aria-label="Search medicines"
          />
          <button
            type="button"
            className="btn-secondary shrink-0"
            disabled={!query.trim()}
            onClick={() => pick(query.trim())}
          >
            + Add
          </button>
        </div>
        {open && (
          <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            {loading && <li className="px-3 py-2 text-sm text-slate-400">Searching…</li>}
            {!loading && results.length === 0 && (
              <li className="px-3 py-2 text-sm text-slate-400">No medicines found</li>
            )}
            {results.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => pick(m.name)}
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  {m.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-1.5 text-xs text-slate-400">
        Pick a medicine from the master list, or type your own medicine name in the text area below.
      </p>
    </Field>
  );
}
