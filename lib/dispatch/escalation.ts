/**
 * Offer-timeout escalation for SOS dispatch (audit P5).
 *
 * WHY: until now, the set of doctors offered a request was a snapshot taken
 * at trigger time, and the only mechanism that could add to it was the 20s
 * late-joiner sweep — which re-runs discovery at the SAME radius. So the
 * failure mode was a patient in a thin-supply area: no doctor inside
 * `radius_km`, the request sits pending, and they wait the entire request TTL
 * (5 min) even though a doctor at 12 km would have come.
 *
 * Uber's re-dispatch loop solves this by letting an offer set expire and
 * reaching further out. This module is that loop:
 *
 *   round 0  patient's radius            (at trigger)
 *   round 1  round0 * SOS_ESCALATION_FACTOR   (after SOS_OFFER_TTL_MIN)
 *   round 2  round1 * SOS_ESCALATION_FACTOR   (after another TTL, capped)
 *
 * and then it stops — the request TTL still ends the request, so a patient
 * never waits longer than before; they simply get a *wider* search inside
 * the window they were already going to wait.
 *
 * CONCURRENCY / CORRECTNESS:
 *   - the round counter is advanced by a CONDITIONAL UPDATE
 *     (`WHERE round = expected`), exactly the same affectedRows pattern
 *     `acceptSos` uses to claim a request. Two sweeps racing on one request
 *     cannot double-escalate it; the loser sees affectedRows 0 and returns.
 *   - every insert is still idempotent via UNIQUE(sos_request_id, doctor_id),
 *     so a wider ring that re-discovers an already-offered doctor just skips
 *     them (they get no duplicate notification) — verified by
 *     `findUnofferedDoctors`.
 *   - the request must still be `pending`, and the offer rows must still be
 *     `broadcast`; a request somebody already accepted is never widened.
 */

import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, sosOffers, sosRequests } from "@/lib/db/schema";
import {
  SOS_OFFER_TTL_MIN,
  SOS_ESCALATION_FACTOR,
  SOS_MAX_ESCALATION_ROUND,
} from "@/lib/config";
import { findNearbyOnDutyDoctors, type NearbyDoctor } from "./geo";
import { broadcastToPatient, announceSosToDoctors } from "./hub";
import { canEscalate, escalationRadius } from "./ranking";
import { maskPatient } from "./geo";

/** Why a sweep declined to escalate a request — for logs and tests. */
export type EscalationOutcome =
  | { kind: "escalated"; round: number; radiusKm: number; newDoctors: number }
  | { kind: "no-op"; reason: "recent" | "max-round" | "terminal" | "disabled" | "not-found" | "no-candidates" | "race-lost" };

/**
 * Advance a pending request by one escalation round if its current offer set
 * has stood longer than `SOS_OFFER_TTL_MIN`.
 *
 * Returns the outcome rather than throwing: a sweep runs on a poll path and
 * must never take the patient's status read down with it.
 */
export async function escalateStaleRequest(requestId: number): Promise<EscalationOutcome> {
  if (SOS_OFFER_TTL_MIN <= 0) return { kind: "no-op", reason: "disabled" };

  const [req] = await db
    .select({
      id: sosRequests.id,
      status: sosRequests.status,
      patientId: sosRequests.patientId,
      latitude: sosRequests.latitude,
      longitude: sosRequests.longitude,
      radiusKm: sosRequests.radiusKm,
      complaint: sosRequests.complaint,
      escalationRound: sosRequests.escalationRound,
      lastEscalatedAt: sosRequests.lastEscalatedAt,
      createdAt: sosRequests.createdAt,
    })
    .from(sosRequests)
    .where(eq(sosRequests.id, requestId))
    .limit(1);

  if (!req) return { kind: "no-op", reason: "not-found" };
  // Only a live, unclaimed request may widen — accepted/cancelled/completed
  // are terminal and `expired` has nothing left to offer.
  if (req.status !== "pending") return { kind: "no-op", reason: "terminal" };

  const round = req.escalationRound ?? 0;
  if (!canEscalate(round, SOS_MAX_ESCALATION_ROUND)) {
    return { kind: "no-op", reason: "max-round" };
  }

  // When did the current round's offer set start? The first round is the
  // request itself; later rounds are dated by the last escalation timestamp.
  const roundStartedAt = round === 0 ? req.createdAt : req.lastEscalatedAt ?? req.createdAt;
  const cutoff = new Date(Date.now() - SOS_OFFER_TTL_MIN * 60_000);
  if (!roundStartedAt || roundStartedAt >= cutoff) return { kind: "no-op", reason: "recent" };

  const lat = Number(req.latitude);
  const lng = Number(req.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { kind: "no-op", reason: "not-found" };

  const baseRadius = req.radiusKm ?? 10;
  const nextRound = round + 1;
  const radiusKm = escalationRadius(baseRadius, nextRound);

  // Atomic round advance — the same affectedRows claim pattern as acceptSos.
  const claimed = await db
    .update(sosRequests)
    .set({
      escalationRound: nextRound,
      lastEscalatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(sosRequests.id, requestId), eq(sosRequests.escalationRound, round)));
  if (claimed[0].affectedRows !== 1) return { kind: "no-op", reason: "race-lost" };

  // Widen: discover at the larger radius, keep only genuinely new doctors.
  const nearby: NearbyDoctor[] = await findNearbyOnDutyDoctors(lat, lng, radiusKm).catch(() => []);
  if (nearby.length === 0) {
    // Nothing at the wider radius either. The round is still spent (the
    // timestamp advanced), so a retry happens after another TTL at the next
    // factor — this is what stops a single failed escalation from burning the
    // whole budget.
    return { kind: "no-op", reason: "no-candidates" };
  }

  const fresh = await findUnofferedDoctors(requestId, nearby);
  if (fresh.length === 0) {
    // Everyone in range was already offered in round 0 — the wider ring found
    // no NEW bodies. Note the difference from `no-candidates`: supply existed,
    // we had already asked all of it.
    return { kind: "escalated", round: nextRound, radiusKm, newDoctors: 0 };
  }

  const inserted: NearbyDoctor[] = [];
  for (const doc of fresh) {
    try {
      await db.insert(sosOffers).values({
        sosRequestId: requestId,
        doctorId: doc.doctorId,
        clinicId: doc.clinicId,
        distanceKm: String(doc.distanceKm),
        status: "broadcast",
      });
      inserted.push(doc);
    } catch {
      /* UNIQUE race with a concurrent sweep — already offered, skip */
    }
  }
  if (inserted.length === 0) {
    return { kind: "escalated", round: nextRound, radiusKm, newDoctors: 0 };
  }

  // Tell the patient the search widened — a wide ring with no message looks
  // exactly like nothing happening.
  broadcastToPatient(req.patientId, { type: "sos:status", requestId, status: "searching" });

  // Same privacy posture as discovery.ts: the patient's name is masked to
  // initials until a doctor ACCEPTS, so a widened ring leaks no more identity
  // than the original broadcast did.
  const [patient] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, req.patientId))
    .limit(1);

  await announceSosToDoctors(
    inserted.map((d) => d.doctorId),
    {
      requestId,
      distanceKm: inserted[0].distanceKm,
      complaint: req.complaint,
      patient: maskPatient(patient?.name ?? "Patient"),
    }
  );

  return { kind: "escalated", round: nextRound, radiusKm, newDoctors: inserted.length };
}

/**
 * Filter a discovery result down to doctors who do not already hold an offer
 * for this request. Exported because both the sweep and its tests need the
 * same rule, and the rule is the one that keeps a wider ring from
 * re-notifying everybody inside it.
 */
export async function findUnofferedDoctors(
  requestId: number,
  nearby: NearbyDoctor[]
): Promise<NearbyDoctor[]> {
  if (nearby.length === 0) return [];
  const existing = await db
    .select({ doctorId: sosOffers.doctorId })
    .from(sosOffers)
    .where(and(eq(sosOffers.sosRequestId, requestId), ne(sosOffers.status, "expired")));
  const seen = new Set(existing.map((r) => r.doctorId));
  return nearby.filter((d) => !seen.has(d.doctorId));
}

/**
 * Bulk sweep for the cron — every pending request that is not already at its
 * final round (audit P5).
 *
 * The per-request recency check lives inside `escalateStaleRequest`, which is
 * authoritative: it has the round's own start timestamp, which the bulk query
 * would have to reconstruct with a COALESCE per row. Kept out of SQL so the
 * two paths cannot disagree about when a round started.
 *
 * Mirrors the shape of `expireStalePendingRequests` so the cron route can host
 * both, and returns how many requests it widened.
 */
export async function escalateAllStaleRequests(limit = 100): Promise<number> {
  const stale = await db
    .select({ id: sosRequests.id })
    .from(sosRequests)
    .where(
      and(
        eq(sosRequests.status, "pending"),
        ne(sosRequests.escalationRound, SOS_MAX_ESCALATION_ROUND)
      )
    )
    .limit(Math.max(1, Math.min(limit, 500)));

  let escalated = 0;
  for (const row of stale) {
    const outcome = await escalateStaleRequest(row.id).catch(() => null);
    if (outcome?.kind === "escalated") escalated++;
  }
  return escalated;
}

/** Re-exported for the doctor panel's "expanded search" copy. */
export { SOS_ESCALATION_FACTOR };
