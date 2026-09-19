"use client";

import { useActionState, useRef, useState } from "react";
import { CalendarPlus, FileUp, FilePlus2 } from "lucide-react";
import { createAppointment } from "../actions";

type Patient = { id: number; name: string; phone: string | null };
type DoctorOption = { id: number; name: string; salutation: string | null; qualification: string | null };

const initialState = { error: null as string | null };

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
// "Generate new" paths — sub-options shown when the doctor picks "Generate new".
const CONSENT_TYPES = [
  { value: "otp", label: "Send OTP (WhatsApp)" },
  { value: "consent", label: "Send Consent Link" },
  { value: "skipped", label: "Skip Consent" },
  { value: "email", label: "Send Email" },
];

type ConsentMode = "upload" | "generate";

export function BookAppointmentForm({
  patients,
  doctors = [],
}: {
  patients: Patient[];
  doctors?: DoctorOption[];
}) {
  const [state, formAction, pending] = useActionState(createAppointment, initialState);
  // Flow: the consent popup (Upload / Generate new) opens first, then the
  // booking form becomes usable. The consent card stays mounted (hidden) after
  // the popup closes so consent_type / consent_file still submit with the form.
  const [step, setStep] = useState<"consent" | "booking">("consent");
  const [consentMode, setConsentMode] = useState<ConsentMode | null>(null);
  const [consentType, setConsentType] = useState("otp");
  const [fileName, setFileName] = useState("");
  const [consentError, setConsentError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const today = new Date().toLocaleDateString("en-CA");

  const continueToBooking = () => {
    if (!consentMode) {
      setConsentError("Choose Upload or Generate new to continue.");
      return;
    }
    if (consentMode === "upload" && !fileName) {
      setConsentError("Attach the signed consent form, or pick Generate new.");
      return;
    }
    setConsentError("");
    setStep("booking");
  };

  const consentSummary =
    consentMode === "upload"
      ? `Upload — signed consent form${fileName ? ` (${fileName})` : ""}`
      : consentMode === "generate"
        ? `Generate new — ${CONSENT_TYPES.find((c) => c.value === consentType)?.label ?? ""}`
        : "Not selected";

  return (
    <div className="card p-7">
      <form action={formAction} className="space-y-5">
        {/* Receptionist books on behalf of a practice doctor; doctors book for
            themselves (no field submitted). */}
        {doctors.length > 0 && (
          <div>
            <label htmlFor="doctor_id" className="label">Doctor</label>
            <select id="doctor_id" name="doctor_id" className="input" defaultValue={String(doctors[0]?.id ?? "")}>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.salutation ? `${d.salutation} ` : ""}
                  {d.name}
                  {d.qualification ? ` — ${d.qualification}` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="patient_id" className="label">Patient</label>
            <select id="patient_id" name="patient_id" className="input" defaultValue="">
              <option value="" disabled>Select patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.phone ? `· ${p.phone}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="patient_string" className="label">Or walk-in name</label>
            <input
              id="patient_string"
              name="patient_string"
              placeholder="Walk-in patient name"
              className="input"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="label">Date</label>
            <input
              id="date"
              name="date"
              type="date"
              required
              min={today}
              defaultValue={today}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="time" className="label">Time</label>
            <input
              id="time"
              name="time"
              type="time"
              required
              className="input"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="case_type" className="label">Visit type</label>
            <select id="case_type" name="case_type" className="input" defaultValue="clinical_visit">
              <option value="clinical_visit">Clinical visit</option>
              <option value="home_visit">Home visit</option>
              <option value="online_visit">Online visit</option>
              <option value="on_call_visit">On-call visit</option>
            </select>
          </div>
          <div>
            <label htmlFor="blood_group" className="label">Blood group</label>
            <select id="blood_group" name="blood_group" className="input" defaultValue="">
              <option value="">Select...</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label htmlFor="bp" className="label">BP (e.g., 120/80)</label>
            <input
              id="bp"
              name="bp"
              placeholder="e.g., 120/80"
              className="input"
            />
          </div>
          <div>
            <label htmlFor="weight" className="label">Weight (kg)</label>
            <input
              id="weight"
              name="weight"
              type="number"
              step="0.1"
              min="0"
              max="500"
              placeholder="e.g., 70"
              className="input"
            />
          </div>
          <div>
            <label htmlFor="height" className="label">Height (cm)</label>
            <input
              id="height"
              name="height"
              type="number"
              step="0.1"
              min="0"
              max="300"
              placeholder="e.g., 170"
              className="input"
            />
          </div>
        </div>

        <div>
          <label htmlFor="mobile_number" className="label">Mobile number (for WhatsApp notifications)</label>
          <input
            id="mobile_number"
            name="mobile_number"
            type="tel"
            placeholder="e.g., 9876543210"
            className="input"
          />
        </div>

        <div>
          <label htmlFor="remarks" className="label">Remarks for receptionist</label>
          <textarea
            id="remarks"
            name="remarks"
            rows={3}
            placeholder="Remarks for receptionist..."
            className="input"
          />
        </div>

        {/* Consent summary — shown after the popup is completed */}
        {step === "booking" && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-800">Consent form</p>
              <p className="truncate text-sm text-slate-600">{consentSummary}</p>
            </div>
            <button
              type="button"
              onClick={() => setStep("consent")}
              className="shrink-0 text-sm font-semibold text-brand-700 underline hover:text-brand-600"
            >
              Change
            </button>
          </div>
        )}

        {state.error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="btn-primary w-full !rounded-xl !py-3.5"
        >
          <CalendarPlus className="h-4 w-4" />
          {pending ? "Booking..." : "Book appointment"}
        </button>

        {/* Step 1: consent form popup — opens before the booking form; after
            "Continue to booking" it hides (inputs stay mounted and submitted). */}
        <div
          className={
            step === "consent"
              ? "fixed inset-0 z-50 flex items-center justify-center p-4"
              : "hidden"
          }
        >
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="consent-popup-title"
            className="relative z-10 max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <div>
              <h2 id="consent-popup-title" className="text-[17px] font-semibold tracking-[-0.01em] text-ink">
                Consent form
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Choose how the patient&apos;s consent will be collected for this appointment, then continue to the booking form.
              </p>
            </div>

            {/* Two top-level options: Upload existing / Generate new */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setConsentMode("upload");
                  setConsentType("otp");
                  setConsentError("");
                }}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                  consentMode === "upload"
                    ? "border-brand-500 bg-accent-50"
                    : "border-slate-200 bg-white hover:border-brand-300"
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                  <FileUp className="h-4.5 w-4.5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">Upload</span>
                  <span className="block text-xs text-slate-500">Attach a signed consent form (JPG, PNG, PDF)</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setConsentMode("generate");
                  setFileName("");
                  setConsentError("");
                }}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                  consentMode === "generate"
                    ? "border-brand-500 bg-accent-50"
                    : "border-slate-200 bg-white hover:border-brand-300"
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                  <FilePlus2 className="h-4.5 w-4.5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">Generate new</span>
                  <span className="block text-xs text-slate-500">Send OTP, consent link, email, or skip</span>
                </span>
              </button>
            </div>

            {/* Upload path: attach the signed/printed consent document */}
            {consentMode === "upload" && (
              <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                <input type="hidden" name="consent_type" value="upload" />
                <label htmlFor="consent_file" className="label">Signed consent form</label>
                <input
                  ref={fileInputRef}
                  id="consent_file"
                  name="consent_file"
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
                />
                {fileName && <p className="text-xs text-slate-500">Selected: {fileName}</p>}
                <p className="text-xs text-slate-400">Max 5 MB. The appointment is confirmed immediately once uploaded.</p>
              </div>
            )}

            {/* Generate-new path: send OTP / consent link / email, or skip */}
            {consentMode === "generate" && (
              <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {CONSENT_TYPES.map((ct) => (
                    <label
                      key={ct.value}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm cursor-pointer hover:border-brand-300 has-[:checked]:border-brand-500 has-[:checked]:bg-accent-50"
                    >
                      <input
                        type="radio"
                        name="consent_type"
                        value={ct.value}
                        checked={consentType === ct.value}
                        onChange={(e) => setConsentType(e.target.value)}
                        className="accent-brand-700"
                      />
                      {ct.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {consentError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {consentError}
              </p>
            )}

            <button
              type="button"
              onClick={continueToBooking}
              className="btn-primary w-full !rounded-xl !py-3"
            >
              Continue to booking
            </button>
            <button
              type="button"
              onClick={() => {
                // Decide later = submit NO consent choice: reset the mode so
                // the hidden consent_type input / radios unmount and the
                // appointment books with status "pending".
                setConsentMode(null);
                setFileName("");
                setConsentError("");
                setStep("booking");
              }}
              className="w-full text-center text-xs font-medium text-slate-400 underline hover:text-slate-600"
            >
              Decide later
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
