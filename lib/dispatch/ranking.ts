/**
 * Candidate ranking + radius escalation for SOS dispatch (audit P5).
 *
 * WHY: the reference designs (Uber's DISCO marketplace, the standard
 * ride-hailing LLD) do NOT offer to the nearest driver — they offer to a
 * *scored* candidate set, ranked on pickup ETA plus signals that predict
 * acceptance. SkoraCares ranked on distance alone
 * (`nearby.sort((a, b) => a.distanceKm - b.distanceKm)`), which has a real
 * failure mode: a doctor who is 400 m away but has declined five SOS offers
 * this hour is preferred over an idle doctor 2 km out. The patient waits for
 * someone who was never going to come.
 *
 * This module is the scoring half. It is deliberately PURE (no db import) so
 * it is unit-testable and cannot acquire a server-only dependency: callers
 * gather the per-doctor stats, this ranks.
 *
 * The weights are production-shaped, not tuned. Distance dominates (0.5)
 * because it is the only signal that reliably helps the patient; acceptance
 * rate (0.3) and duty freshness (0.2) break ties toward a doctor who answers.
 * `WEIGHTS` is exported so a test can assert the ordering contract rather
 * than re-deriving arithmetic.
 */

import { SOS_ESCALATION_FACTOR, SOS_ESCALATION_MAX_KM } from "@/lib/config";

export const WEIGHTS = {
  /** Straight-line pickup distance — the dominant term. */
  distance: 0.5,
  /** `accepted / (accepted + declined)` over the offer history window. */
  acceptance: 0.3,
  /** Minutes on duty — fresher duty means a doctor who just came online. */
  duty: 0.2,
} as const;

/** Input stats for one candidate doctor. */
export type CandidateStats = {
  /** Distance from the patient, km. */
  distanceKm: number;
  /** Offers this doctor accepted in the history window (>= 0). */
  accepted: number;
  /** Offers this doctor declined in the history window (>= 0). */
  declined: number;
  /** Consecutive minutes on duty; null when unknown. */
  onDutyMinutes: number | null;
};

/**
 * Acceptance ratio in [0, 1], defaulting to 0.5 for an unknown doctor.
 *
 * A doctor with no history must not score as either a hero or a leper: 0.5 is
 * the neutral midpoint, so `accepted: 0, declined: 0` ranks exactly like a
 * doctor who answers half the time.
 */
export function acceptanceRatio(accepted: number, declined: number): number {
  const total = accepted + declined;
  if (total <= 0) return 0.5;
  return Math.min(1, Math.max(0, accepted / total));
}

/**
 * Duty-freshness score in [0, 1], saturating at 4 hours.
 *
 * Bias TOWARD freshness: a doctor who flipped on-duty 10 minutes ago has not
 * been worn down by offer fatigue, while one on duty since 2am has seen every
 * request in the region. Saturating (rather than linear) means a 5th hour
 * adds nothing, so an overnight doctor is not buried.
 */
export function dutyScore(onDutyMinutes: number | null): number {
  if (onDutyMinutes === null || !Number.isFinite(onDutyMinutes)) return 0.5;
  const clamped = Math.min(Math.max(onDutyMinutes, 0), 240);
  return 1 - clamped / 240;
}

/**
 * The comparable score. HIGHER IS BETTER.
 *
 * Distance is inverted here so all three terms point the same way: a score of
 * 1 is "on top of the patient, answers everything, just came online".
 */
export function candidateScore(stats: CandidateStats): number {
  const distanceTerm = 1 / (1 + Math.max(0, stats.distanceKm));
  const acceptanceTerm = acceptanceRatio(stats.accepted, stats.declined);
  const dutyTerm = dutyScore(stats.onDutyMinutes);
  return (
    WEIGHTS.distance * distanceTerm +
    WEIGHTS.acceptance * acceptanceTerm +
    WEIGHTS.duty * dutyTerm
  );
}

/**
 * Ranked candidate list. Stable on equal scores (input order preserved), so
 * two doctors with identical stats dispatch in discovery order rather than in
 * a JS engine's insertion order — which would make a broadcast nondeterministic
 * and the tests lie about it.
 */
export function rankCandidates<T extends CandidateStats & { id: number }>(
  candidates: T[]
): T[] {
  return candidates
    .map((candidate, index) => ({ candidate, index }))
    .sort((a, b) => {
      const diff = candidateScore(b.candidate) - candidateScore(a.candidate);
      // Distance is the tie-break so a score collision still favors proximity.
      return diff !== 0 ? diff : a.candidate.distanceKm - b.candidate.distanceKm || a.index - b.index;
    })
    .map((entry) => entry.candidate);
}

/**
 * Radius for escalation round `round`, starting at `baseRadius`.
 *
 * round 0 returns the patient's own radius unchanged — the first broadcast
 * must honour what the patient asked for. Each later round multiplies, and the
 * result is capped so the ring widens but never runs away.
 */
export function escalationRadius(baseRadius: number, round: number): number {
  if (round <= 0) return baseRadius;
  const raw = baseRadius * SOS_ESCALATION_FACTOR ** round;
  return Math.min(Math.round(raw * 10) / 10, SOS_ESCALATION_MAX_KM);
}

/** True when a further escalation round is still allowed. */
export function canEscalate(round: number, maxRound: number): boolean {
  return round < maxRound;
}
