"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { updatePatientNotificationPreferences } from "./actions";
import {
  PATIENT_PREF_CHANNELS,
  PATIENT_PREF_EVENTS,
  PATIENT_CHANNEL_LABELS,
  PATIENT_EVENT_LABELS,
  type PatientPrefs,
} from "./prefs-shared";

/**
 * Per-channel notification preferences, surfaced inside the notification
 * centre (§7.2.4 — "one place"). The prefs are fetched by the SERVER page
 * (no client-side load state) and submitted through the server action. Only
 * the channels anything actually sends — email and in-app; no placebo SMS
 * row, and no rows for events that never target patients.
 */
export function PatientNotificationPreferences({ prefs }: { prefs: PatientPrefs }) {
  const [state, formAction, pending] = useActionState(
    updatePatientNotificationPreferences,
    { error: null as string | null, success: false }
  );

  return (
    <section aria-labelledby="notif-prefs-heading" className="mt-8">
      <h2 id="notif-prefs-heading" className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        Notification preferences
      </h2>
      <form action={formAction} className="mt-3 space-y-3">
        {PATIENT_PREF_EVENTS.map((event) => (
          <div key={event} className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-ink">{PATIENT_EVENT_LABELS[event].title}</h3>
            <p className="text-xs text-slate-400">{PATIENT_EVENT_LABELS[event].description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-5">
              {PATIENT_PREF_CHANNELS.map((channel) => (
                <label
                  key={channel}
                  className="flex items-center gap-2 text-sm text-slate-600"
                >
                  <input
                    type="checkbox"
                    name={`${event}_${channel}`}
                    defaultChecked={prefs[event][channel]}
                    aria-label={`${PATIENT_CHANNEL_LABELS[channel]} — ${PATIENT_EVENT_LABELS[event].title}`}
                    className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
                  />
                  {PATIENT_CHANNEL_LABELS[channel]}
                </label>
              ))}
            </div>
          </div>
        ))}

        {state.error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </p>
        )}
        {state.success && (
          <p className="flex items-center gap-2 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-800">
            <CheckCircle2 className="h-4 w-4" /> Preferences saved.
          </p>
        )}

        <button type="submit" disabled={pending} className="btn-primary !py-2.5 text-sm">
          {pending ? "Saving…" : "Save preferences"}
        </button>
      </form>
    </section>
  );
}
