"use client";

import { useActionState, useState } from "react";
import { CalendarPlus } from "lucide-react";
import { createAppointment } from "../actions";

type Patient = { id: number; name: string; phone: string | null };

const initialState = { error: null as string | null };

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const CONSENT_TYPES = [
  { value: "otp", label: "Send OTP (WhatsApp)" },
  { value: "consent", label: "Send Consent Link" },
  { value: "upload", label: "Upload Image" },
  { value: "skipped", label: "Skip Consent" },
  { value: "email", label: "Send Email" },
];

export function BookAppointmentForm({ patients }: { patients: Patient[] }) {
  const [state, formAction, pending] = useActionState(createAppointment, initialState);
  const [showConsent, setShowConsent] = useState(false);
  const [consentType, setConsentType] = useState("otp");
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
            className="text-sm text-teal-700 underline hover:text-teal-800"
          >
            {showConsent ? "Hide" : "Show"} consent form
          </button>
        </div>

        {showConsent && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-4">
            <h5 className="font-semibold text-gray-800">Consent Form</h5>
            <div className="grid grid-cols-2 gap-3">
              {CONSENT_TYPES.map((ct) => (
                <label
                  key={ct.value}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm cursor-pointer hover:border-teal-300 has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50"
                >
                  <input
                    type="radio"
                    name="consent_type"
                    value={ct.value}
                    checked={consentType === ct.value}
                    onChange={(e) => setConsentType(e.target.value)}
                    className="accent-teal-600"
                  />
                  {ct.label}
                </label>
              ))}
            </div>
            {consentType === "upload" && (
              <div>
                <label className="label">Upload consent file</label>
                <input
                  type="file"
                  name="consent_file"
                  accept="image/jpeg,image/png,application/pdf"
                  className="input"
                />
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