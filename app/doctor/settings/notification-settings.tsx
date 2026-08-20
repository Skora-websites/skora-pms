"use client";

import { useActionState, useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { updateNotificationPreferences, getNotificationPreferences, type NotificationPrefs } from "./actions";

const initialState = { error: null as string | null, success: false };

const EVENT_LABELS: Record<keyof NotificationPrefs, string> = {
  appointment_booking: "New Appointment Booking",
  appointment_cancellation: "Appointment Cancellation",
  lab_report_ready: "Lab Report Ready",
  follow_up_reminder: "Follow-up Reminder",
};

const EVENT_DESCRIPTIONS: Record<keyof NotificationPrefs, string> = {
  appointment_booking: "Alert when an appointment is booked",
  appointment_cancellation: "Alert if an appointment is cancelled",
  lab_report_ready: "Notify when test reports are available",
  follow_up_reminder: "Scheduled follow-ups from doctors",
};

const CHANNELS = [
  { id: "email", label: "Email" },
  { id: "sms", label: "SMS" },
  { id: "in_app", label: "In App" },
];

export function NotificationSettings() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, formAction, pending] = useActionState(updateNotificationPreferences, initialState);

  useEffect(() => {
    getNotificationPreferences().then((data) => {
      setPrefs(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-400">Loading preferences…</p>;
  }

  if (!prefs) {
    return <p className="text-sm text-red-600">Failed to load preferences.</p>;
  }

  return (
    <form action={formAction} className="space-y-6">
      {Object.entries(prefs).map(([event, channels]) => (
        <div key={event} className="rounded-xl border border-slate-200 p-5">
          <div>
            <h3 className="font-semibold text-slate-900">
              {EVENT_LABELS[event as keyof NotificationPrefs] || event}
            </h3>
            <p className="text-xs text-slate-400">
              {EVENT_DESCRIPTIONS[event as keyof NotificationPrefs] || ""}
            </p>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-6">
            {CHANNELS.map((channel) => {
              const checked = (channels as Record<string, boolean>)[channel.id] ?? true;
              const name = `${event}_${channel.id}`;
              return (
                <label key={channel.id} className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    name={name}
                    defaultChecked={checked}
                    className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
                  />
                  {channel.label}
                </label>
              );
            })}
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
          <CheckCircle2 className="h-4 w-4" /> Preferences saved successfully.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-primary !py-2.5 text-sm"
      >
        {pending ? "Saving…" : "Save preferences"}
      </button>
    </form>
  );
}