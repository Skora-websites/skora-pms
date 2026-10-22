/**
 * Trial-window rules — the ONE definition of "is this doctor's access live?".
 *
 * Kept free of DB/Next imports so the guards (doctor layout, API permission
 * guards, server actions) and the unit tests share a single copy, and so
 * tests never need DATABASE_URL.
 *
 * `users.trial_ends_at` doubles as the paid-access expiry (a verified package
 * purchase extends it — see lib/packages/fulfillment.ts), so this same
 * predicate gates both the trial window and the paid window.
 */

/** Structural minimum every guard can supply — no CurrentUser import needed. */
type TrialBearer = { role: string; trialEndsAt: Date | null | string | undefined };

/** Default free-trial length in days, matching company_settings.default_trial_days. */
export const DEFAULT_TRIAL_DAYS = 15;

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Trial-end timestamp for a new doctor, `days` from now. */
export function trialEndsInDays(days: number, now: number = Date.now()): Date {
  if (!Number.isFinite(days) || days <= 0) {
    throw new RangeError(`trialEndsInDays requires a positive day count, got ${days}`);
  }
  return new Date(now + days * DAY_MS);
}

/**
 * True only when the bearer is a doctor whose access window has ended.
 *
 * `trialEndsAt` null/undefined means "no trial restriction" (seeded and legacy
 * doctors) — never "expired". Every non-doctor role always returns false:
 * staff tiers carry no trial. The comparison is inclusive (`<=`): access stops
 * at the exact expiry instant.
 */
export function isTrialExpired(user: TrialBearer): boolean {
  if (user.role !== "doctor" || !user.trialEndsAt) return false;
  return new Date(user.trialEndsAt).getTime() <= Date.now();
}

/** Milliseconds of access left — 0 when expired or unrestricted. */
export function msUntilTrialEnd(user: TrialBearer, now: number = Date.now()): number {
  if (user.role !== "doctor" || !user.trialEndsAt) return 0;
  return Math.max(0, new Date(user.trialEndsAt).getTime() - now);
}
