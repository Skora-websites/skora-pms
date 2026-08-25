"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { updateAppointment } from "../../actions";

type Patient = { id: number; name: string; phone: string | null };

const initialState = { error: null as string | null };

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function EditAppointmentForm({
  appointment,
  patients,
}: {
  appointment: {
    id: number;
    patientId: number | null;
    patientString: string | null;
    date: string;
    time: string;
    caseType: string;
    bloodGroup: string | null;
    bp: string | null;
    weight: string | null;
    height: string | null;
    remarks: string | null;
    mobileNumber: string | null;
  };
  patients: Patient[];
}) {
  const [state, formAction, pending] = useActionState(updateAppointment, initialState);
  const today = new Date().toLocaleDateString("en-CA");

  return (
    <div className="card p-7">
      <form action={formAction} className="space-y-5">
        <input type="hidden" name="appointment_id" value={appointment.id} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="patient_id" className="label">Patient</label>
            <select id="patient_id" name="patient_id" className="input" defaultValue={appointment.patientId ?? ""}>
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
              defaultValue={appointment.patientString ?? ""}
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
              defaultValue={appointment.date}
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
              defaultValue={appointment.time}
              className="input"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="case_type" className="label">Visit type</label>
            <select id="case_type" name="case_type" className="input" defaultValue={appointment.caseType}>
              <option value="clinical_visit">Clinical visit</option>
              <option value="home_visit">Home visit</option>
              <option value="online_visit">Online visit</option>
              <option value="on_call_visit">On-call visit</option>
            </select>
          </div>
          <div>
            <label htmlFor="blood_group" className="label">Blood group</label>
            <select id="blood_group" name="blood_group" className="input" defaultValue={appointment.bloodGroup ?? ""}>
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
            <input id="bp" name="bp" defaultValue={appointment.bp ?? ""} placeholder="e.g., 120/80" className="input" />
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
              defaultValue={appointment.weight ?? ""}
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
              defaultValue={appointment.height ?? ""}
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
            defaultValue={appointment.mobileNumber ?? ""}
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
            defaultValue={appointment.remarks ?? ""}
            placeholder="Remarks for receptionist..."
            className="input"
          />
        </div>

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
          <Save className="h-4 w-4" />
          {pending ? "Saving..." : "Update appointment"}
        </button>
      </form>
    </div>
  );
}