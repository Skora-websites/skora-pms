"use client";

import { useActionState, useRef, useState } from "react";
import { CalendarPlus, FileUp, FilePlus2 } from "lucide-react";
import { createAppointment } from "../actions";

type Patient = { id: number; name: string; phone: string | null };

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

export function BookAppointmentForm({ patients }: { patients: Patient[] }) {
  const [state, formAction, pending] = useActionState(createAppointment, initialState);
  const [showConsent, setShowConsent] = useState(false);
  const [consentMode, setConsentMode] = useState<ConsentMode | null>(null);
  const [consentType, setConsentType] = useState("otp");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const today = new Date().toLocaleDateString("en-CA");

  return (
    <div className="card p-7">
      <form action={formAction} className="space-y-5">
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

        {/* Consent form section */}
        <div>
          <button
            type="button"
            onClick={() => setShowConsent(!showConsent)}
            className="text-sm font-semibold text-brand-700 underline hover:text-brand-600"
          >
            {showConsent ? "Hide" : "Show"} consent form
          </button>
        </div>

        {showConsent && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-4">
            <h5 className="font-semibold text-gray-800">Consent Form</h5>

            {/* Two top-level options: Upload existing / Generate new */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConsentMode("upload")}
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
                onClick={() => setConsentMode("generate")}
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
                  required
                  onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
                />
                {fileName && <p className="text-xs text-slate-500">Selected: {fileName}</p>}
                <p className="text-xs text-slate-400">Max 5 MB. The appointment is confirmed immediately once uploaded.</p>
              </div>
            )}

            {/* Generate-new path: the existing flow */}
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
      </form>
    </div>
  );
}