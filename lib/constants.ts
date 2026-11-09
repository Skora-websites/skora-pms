/** Shared constants safe to import from both client and server code. */

export const GENDERS = ["Male", "Female", "Other"] as const;

/**
 * Hard cap for unbounded list reads (audit P4): queries that return a whole
 * history (one patient's bills, a practice's follow-up call list) get a
 * generous ceiling so no path can grow without bound as data accumulates.
 * 500 is far above any real page's needs — it bounds the worst case without
 * changing what a current user sees. Lists that need real pagination use the
 * F-04 pageBounds pattern instead.
 */
export const LIST_HARD_CAP = 500;
