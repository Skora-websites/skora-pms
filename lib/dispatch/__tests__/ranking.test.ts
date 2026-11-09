/**
 * Candidate ranking + radius escalation (audit P5).
 *
 * The unit under test is the *ordering contract*, not the arithmetic: the
 * point of the scoring function is that a doctor who is slightly farther away
 * but actually answers their offers must beat one who is 400 m away and has
 * declined five requests this hour. Distance-only dispatch got that backwards,
 * and that is the regression this suite pins.
 *
 * PURE by construction — lib/dispatch/ranking.ts imports nothing but config,
 * so these tests need neither a database nor the react-server condition.
 * Run: npm run test
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  WEIGHTS,
  acceptanceRatio,
  candidateScore,
  canEscalate,
  dutyScore,
  escalationRadius,
  rankCandidates,
} from "../ranking";

const doctor = (id: number, distanceKm: number) => ({
  id,
  distanceKm,
  accepted: 0,
  declined: 0,
  onDutyMinutes: null as number | null,
});

test("acceptanceRatio: neutral for an unknown doctor", () => {
  assert.equal(acceptanceRatio(0, 0), 0.5);
});

test("acceptanceRatio: bracketed to [0,1] and guards a negative total", () => {
  assert.equal(acceptanceRatio(9, 1), 0.9);
  assert.equal(acceptanceRatio(1, 9), 0.1);
  assert.equal(acceptanceRatio(-5, 2), 0.5);
  assert.equal(acceptanceRatio(5, -5), 0.5);
});

test("dutyScore: saturates at 4 hours, neutral when unknown", () => {
  assert.equal(dutyScore(null), 0.5);
  assert.equal(dutyScore(0), 1);
  assert.equal(dutyScore(120), 0.5);
  assert.equal(dutyScore(240), 0);
  // Saturating, not linear: a 5th hour adds nothing and cannot go negative.
  assert.equal(dutyScore(1_000), 0);
});

test("candidateScore: distance dominates and points the right way", () => {
  const near = candidateScore(doctor(1, 0.5));
  const far = candidateScore(doctor(2, 8));
  assert.ok(near > far, "a closer doctor must outscore a farther one");
});

test("ranking: a responding doctor at 2 km beats a serial decliner at 400 m", () => {
  // The exact failure mode of distance-only dispatch: the nearest doctor is
  // the one who never says yes, and the patient waits for them.
  const serial = { ...doctor(1, 0.4), accepted: 1, declined: 19 };
  const reliable = { ...doctor(2, 2), accepted: 18, declined: 2 };

  const ranked = rankCandidates([serial, reliable]);
  assert.deepEqual(
    ranked.map((d) => d.id),
    [2, 1],
    "the doctor who answers must be dispatched first, even though they are farther"
  );
});

test("ranking: distance still wins when the acceptance histories match", () => {
  const ranked = rankCandidates([doctor(1, 8), doctor(2, 1), doctor(3, 3)]);
  assert.deepEqual(
    ranked.map((d) => d.id),
    [2, 3, 1],
    "with equal histories the score must reduce to distance order"
  );
});

test("ranking: duty freshness breaks a genuine tie toward the fresher doctor", () => {
  const sameSpotA = { ...doctor(1, 2), onDutyMinutes: 230 };
  const sameSpotB = { ...doctor(2, 2), onDutyMinutes: 10 };
  const ranked = rankCandidates([sameSpotA, sameSpotB]);
  assert.deepEqual(
    ranked.map((d) => d.id),
    [2, 1],
    "a doctor 10 minutes on duty must outrank one who has seen 4 hours of requests"
  );
});

test("ranking: an unknown doctor is neither promoted nor buried", () => {
  const unknown = doctor(1, 2);
  const halfAndHalf = { ...doctor(2, 2), accepted: 10, declined: 10 };
  assert.equal(
    candidateScore(unknown),
    candidateScore(halfAndHalf),
    "no history must score exactly like a 50% answer rate"
  );
});

test("ranking: exact ties preserve input (discovery) order", () => {
  // The contract is INPUT-ORDER STABILITY, not input-order independence: a
  // full sort of three identically-scored doctors must be a pure function of
  // the order discovery returned them. Anything else — e.g. a tie-break on
  // doctor id, which looks tidier — would make the broadcast set depend on
  // how ids were allocated rather than on what discovery actually found.
  const base = [doctor(1, 2), doctor(2, 2), doctor(3, 2)];
  assert.deepEqual(rankCandidates(base).map((d) => d.id), [1, 2, 3]);

  for (const permutation of [[3, 2, 1], [2, 1, 3], [2, 3, 1]]) {
    const reordered = rankCandidates(permutation.map((id) => base.find((d) => d.id === id)!));
    assert.deepEqual(
      reordered.map((d) => d.id),
      permutation,
      `ties must preserve discovery order, expected ${JSON.stringify(permutation)}`
    );
  }
  // And it must be idempotent — ranking twice changes nothing.
  const once = rankCandidates(base);
  assert.deepEqual(rankCandidates(once).map((d) => d.id), once.map((d) => d.id));
});

test("escalationRadius: round 0 honours the patient's own radius", () => {
  assert.equal(escalationRadius(10, 0), 10);
  assert.equal(escalationRadius(3, 0), 3);
});

test("escalationRadius: grows geometrically but is capped", () => {
  // factor 1.5 from config: 10 → 15 → 22.5 → 33.75 → capped at 50.
  assert.equal(escalationRadius(10, 1), 15);
  assert.equal(escalationRadius(10, 2), 22.5);
  assert.equal(escalationRadius(10, 3), 33.8);
  assert.equal(escalationRadius(40, 3), 50, "the ring must never exceed the ceiling");
  assert.ok(escalationRadius(50, 5) <= 50);
});

test("canEscalate: bounded so the sweep always terminates", () => {
  assert.equal(canEscalate(0, 2), true);
  assert.equal(canEscalate(1, 2), true);
  assert.equal(canEscalate(2, 2), false, "the last round must not escalate again");
  assert.equal(canEscalate(9, 2), false);
});

test("weights must sum to 1", () => {
  // If this drifts, every ranking in production drifts with it — the score is
  // only meaningful as a convex combination.
  const total = WEIGHTS.distance + WEIGHTS.acceptance + WEIGHTS.duty;
  assert.equal(total, 1, "a weight sum that drifts silently changes every ranking");
});
