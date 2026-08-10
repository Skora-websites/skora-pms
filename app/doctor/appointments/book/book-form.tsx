"use client";

import { useActionState } from "react";
import { CalendarPlus } from "lucide-react";
import { createAppointment } from "../../actions";

type Patient = { id: number; name: string; phone: string | null };

const initialState = { error: null as string | null };

export function BookAppointmentForm({ patients }: { patients: Patient[] }) {
  const [state, formAction, pending] = useActionState(createAppointment, initialState);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="card p-7">
      <form action={formAction} className="space-y-5">
        <div>
          <label htmlFor="patient_id" className="label">Patient</label>
          <select id="patient_id" name="patient_id" className="input" defaultValue="">
            <option value="" disabled>Select patient…</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.phone ? `· ${p.phone}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Or add walk-in patient name</label>
          <input name="patient_string" placeholder="Walk-in patient name (if not registered)" className="input" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="label">Date</label>
            <input id="date" name="date" type="date" required min={today} defaultValue={today} className="input" />
          </div>
          <div>
            <label htmlFor="time" className="label">Time</label>
            <input id="time" name="time" type="time" required className="input" />
          </div>
        </div>

        <div>
          <label htmlFor="case_type" className="label">Visit type</label>
          <select id="case_type" name="case_type" className="input" defaultValue="clinical_visit">
            <option value="clinical_visit">Clinical visit</option>
            <option value="home_visit">Home visit</option>
            <option value="online_visit">Online visit</option>
            <option value="on_call_visit">On-call visit</option>
          </select>
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
          <CalendarPlus className="h-4 w-4" />
          {pending ? "Booking…" : "Book appointment"}
        </button>
      </form>
    </div>
  );
}
