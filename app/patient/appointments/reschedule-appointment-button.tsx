"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { reschedulePatientAppointment } from "./actions";

/**
 * Reschedule an upcoming appointment (patient-facing). Expands into a small
 * inline form pre-filled with the current slot; the server action re-runs the
 * full booking validation (availability, duplicates, slot conflict), so any
 * rejection it returns is surfaced verbatim.
 */
export function RescheduleAppointmentButton({
  appointmentId,
  currentDate,
  currentTime,
}: {
  appointmentId: number;
  /** Current slot as stored (legacy "H:MM AM/PM") — shown as the prefill hint. */
  currentDate: string;
  currentTime: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const today = new Date().toLocaleDateString("en-CA");

  async function handleSubmit(formData: FormData) {
    const date = String(formData.get("date") ?? "");
    const time = String(formData.get("time") ?? "");
    setBusy(true);
    setError(null);
    const res = await reschedulePatientAppointment(appointmentId, date, time);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-lg border border-sky-200 px-2.5 py-1 text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-50"
      >
        <CalendarClock className="h-3.5 w-3.5" />
        Reschedule
      </button>
    );
  }

  return (
    <form
      action={handleSubmit}
      className="flex flex-col items-end gap-1.5 rounded-xl border border-sky-200 bg-sky-50/60 p-2.5"
      aria-label={`Reschedule appointment on ${currentDate} at ${currentTime}`}
    >
      <p className="text-[11px] font-medium text-slate-500">
        Currently {currentDate} · {currentTime}
      </p>
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          name="date"
          min={today}
          required
          aria-label="New appointment date"
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
        />
        <input
          type="time"
          name="time"
          required
          aria-label="New appointment time"
          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-sky-600 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-50"
        >
          {busy ? "Rescheduling…" : "Confirm new time"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
      {error && <span className="max-w-56 text-right text-[11px] font-medium text-rose-600">{error}</span>}
    </form>
  );
}
