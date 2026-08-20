"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, Save, Trash2, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { saveSchedules, deleteSchedule } from "./actions";

const initialState = { error: null as string | null };

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const SESSIONS = ["morning", "afternoon", "evening", "night"] as const;

type Schedule = {
  id: number;
  dayOfWeek: string;
  startTime: string | null;
  endTime: string | null;
  sessionType: string;
  maxPatients: number | null;
  is24Hours: boolean | null;
  slotDuration: number | null;
  gapDuration: number | null;
};

export function ScheduleManager({
  clinicId,
  existingSchedules,
}: {
  clinicId: number;
  existingSchedules: Schedule[];
}) {
  const [open, setOpen] = useState(false);
  const [is24Hours, setIs24Hours] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<string[]>(["morning"]);
  const [state, formAction, pending] = useActionState(saveSchedules, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state !== initialState && state.error === null) {
      router.refresh();
      const t = setTimeout(() => setOpen(false), 0);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function toggleDay(day: string) {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function toggleSession(s: string) {
    setSelectedSessions((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Add / update weekly slots</h3>
        {!open && (
          <button type="button" onClick={() => setOpen(true)} className="btn-secondary !py-1.5 !text-xs">
            <Plus className="h-3.5 w-3.5" />
            New schedule
          </button>
        )}
      </div>

      {/* Existing slots with inline delete */}
      {existingSchedules.length > 0 && (
        <div className="mb-4 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2.5">Day</th>
                <th className="px-4 py-2.5">Session</th>
                <th className="px-4 py-2.5">Hours</th>
                <th className="px-4 py-2.5">Max patients</th>
                <th className="px-4 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {existingSchedules.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2.5 font-medium capitalize text-slate-700">{s.dayOfWeek}</td>
                  <td className="px-4 py-2.5 capitalize text-slate-600">
                    {s.sessionType === "full_day" ? "Full day (24 hrs)" : s.sessionType}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {s.is24Hours ? (
                      "24 hours"
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {s.startTime} – {s.endTime}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{s.maxPatients ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteSchedule(s.id);
                        router.refresh();
                      }}
                      className="inline-flex items-center gap-1 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      title="Delete slot"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <form
          action={(fd) => {
            fd.set("doctor_clinic_id", String(clinicId));
            fd.set("days", selectedDays.join(","));
            fd.set("session_types", selectedSessions.join(","));
            fd.set("is_24_hours", is24Hours ? "1" : "0");
            formAction(fd);
          }}
          className="space-y-4 rounded-2xl border border-brand-100 bg-brand-50/40 p-5"
        >
          <div>
            <label className="label">Days</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
                    selectedDays.includes(day)
                      ? "bg-brand-700 text-white"
                      : "border border-slate-200 bg-white text-slate-500 hover:border-brand-200"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-600">24-hour OPD</label>
            <button
              type="button"
              role="switch"
              aria-checked={is24Hours}
              onClick={() => setIs24Hours((v) => !v)}
              className={`relative h-6 w-11 rounded-full transition-colors ${is24Hours ? "bg-brand-700" : "bg-slate-300"}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  is24Hours ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {!is24Hours && (
            <div>
              <label className="label">Session timings</label>
              <div className="grid gap-3 sm:grid-cols-2">
                {SESSIONS.map((s) => (
                  <label
                    key={s}
                    className={`flex items-center gap-2 rounded-xl border bg-white p-3 transition-colors ${
                      selectedSessions.includes(s) ? "border-brand-300" : "border-slate-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSessions.includes(s)}
                      onChange={() => toggleSession(s)}
                      className="h-4 w-4 rounded border-slate-300 accent-brand-700"
                    />
                    <span className="w-20 text-sm font-semibold capitalize text-slate-700">{s}</span>
                    <input
                      name={`${s}_start_time`}
                      type="time"
                      className="input !py-1.5 !text-xs"
                      disabled={!selectedSessions.includes(s)}
                      title={`${s} start time`}
                    />
                    <span className="text-xs text-slate-400">to</span>
                    <input
                      name={`${s}_end_time`}
                      type="time"
                      className="input !py-1.5 !text-xs"
                      disabled={!selectedSessions.includes(s)}
                      title={`${s} end time`}
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor={`max_patients_${clinicId}`} className="label">Max patients / slot</label>
              <input
                id={`max_patients_${clinicId}`}
                name="max_patients"
                type="number"
                min="1"
                defaultValue="10"
                className="input"
              />
            </div>
            <div>
              <label htmlFor={`slot_duration_${clinicId}`} className="label">Slot duration (min)</label>
              <input
                id={`slot_duration_${clinicId}`}
                name="slot_duration"
                type="number"
                min="0"
                step="5"
                defaultValue="0"
                className="input"
              />
            </div>
            <div>
              <label htmlFor={`gap_duration_${clinicId}`} className="label">Gap (min)</label>
              <input
                id={`gap_duration_${clinicId}`}
                name="gap_duration"
                type="number"
                min="0"
                defaultValue="0"
                className="input"
              />
            </div>
          </div>

          {state.error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
          )}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
              <Save className="h-4 w-4" />
              {pending ? "Saving…" : "Save schedule"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}