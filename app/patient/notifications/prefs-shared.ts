/**
 * Client-safe shape + labels for patient notification preferences (§7.2.4).
 * Kept OUT of actions.ts because a "use server" module may only export async
 * functions — the client form imports the constants from here and the server
 * actions from actions.ts.
 *
 * Only the events that actually reach patients (verified against the sending
 * flows): `lab_report_ready` notifies the doctor, `follow_up_reminder` feeds
 * the doctor's call list, and no SMS sender exists anywhere in the codebase —
 * so there is no SMS channel here and no rows for events that never target a
 * patient user.
 */

export const PATIENT_PREF_EVENTS = ["appointment_booking", "appointment_cancellation"] as const;
export type PatientPrefEvent = (typeof PATIENT_PREF_EVENTS)[number];

export const PATIENT_PREF_CHANNELS = ["email", "in_app"] as const;
export type PatientPrefChannel = (typeof PATIENT_PREF_CHANNELS)[number];

export type PatientPrefs = Record<PatientPrefEvent, Record<PatientPrefChannel, boolean>>;
export type PatientPrefState = { error: string | null; success: boolean };

export const PATIENT_EVENT_LABELS: Record<PatientPrefEvent, { title: string; description: string }> = {
  // The visit-completion email fires under the booking event (see
  // app/doctor/appointments/actions.ts), so one title covers both.
  appointment_booking: {
    title: "Bookings & visit updates",
    description: "Confirmations, changes to your bookings, and visit-completion notes",
  },
  appointment_cancellation: {
    title: "Appointment cancellations",
    description: "Alerts when the clinic cancels one of your appointments",
  },
};

export const PATIENT_CHANNEL_LABELS: Record<PatientPrefChannel, string> = {
  email: "Email",
  in_app: "In this app",
};

/** Missing keys mean "allowed" — the same rule `wantsNotification` applies. */
export function mergePatientPrefs(stored: Partial<PatientPrefs> | null): PatientPrefs {
  const merged: PatientPrefs = {
    appointment_booking: { email: true, in_app: true },
    appointment_cancellation: { email: true, in_app: true },
  };
  if (stored) {
    for (const event of PATIENT_PREF_EVENTS) {
      for (const channel of PATIENT_PREF_CHANNELS) {
        if (stored[event]?.[channel] === false) merged[event][channel] = false;
      }
    }
  }
  return merged;
}
