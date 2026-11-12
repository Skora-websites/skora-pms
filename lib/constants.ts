/** Shared constants safe to import from both client and server code. */

export const GENDERS = ["Male", "Female", "Other"] as const;

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];
export const isBloodGroup = (x: string): x is BloodGroup =>
  (BLOOD_GROUPS as readonly string[]).includes(x);

export const PAYMENT_METHODS = ["upi", "cash", "card", "netbanking"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const isPaymentMethod = (x: string): x is PaymentMethod =>
  (PAYMENT_METHODS as readonly string[]).includes(x);

export const APPOINTMENT_STATUSES = [
  "pending",
  "pending_consent",
  "confirmed",
  "checked_in",
  "completed",
  "cancelled",
  "no_show",
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];
export const isAppointmentStatus = (x: string): x is AppointmentStatus =>
  (APPOINTMENT_STATUSES as readonly string[]).includes(x);

export const CASE_TYPES = [
  "clinical_visit",
  "home_visit",
  "online_visit",
  "on_call_visit",
] as const;
export type CaseType = (typeof CASE_TYPES)[number];
export const isCaseType = (x: string): x is CaseType =>
  (CASE_TYPES as readonly string[]).includes(x);

export const CONSENT_TYPES = ["otp", "consent", "upload", "skipped", "email"] as const;
export type ConsentType = (typeof CONSENT_TYPES)[number];
export const isConsentType = (x: string): x is ConsentType =>
  (CONSENT_TYPES as readonly string[]).includes(x);

export const WEEK_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export const SESSION_TYPES = ["morning", "afternoon", "evening", "night", "full_day"] as const;

/**
 * Hard cap for unbounded list reads (audit P4): queries that return a whole
 * history (one patient's bills, a practice's follow-up call list) get a
 * generous ceiling so no path can grow without bound as data accumulates.
 * 500 is far above any real page's needs — it bounds the worst case without
 * changing what a current user sees. Lists that need real pagination use the
 * F-04 pageBounds pattern instead.
 */
export const LIST_HARD_CAP = 500;

