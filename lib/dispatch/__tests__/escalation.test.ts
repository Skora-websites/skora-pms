/**
 * Offer-timeout escalation (audit P5) — the DB-backed half.
 *
 * lib/dispatch/__tests__/ranking.test.ts covers the pure ordering/radius math.
 * This suite covers what only a live database can show: the conditional round
 * advance, the UNIQUE-based idempotence of a wider ring, and the terminal-state
 * guards that stop a sweep from widening a case somebody already took.
 *
 * The property that matters most: widening must NEVER duplicate an offer or
 * notify a doctor twice. Established offers are filtered out by doctor_id
 * before insert and by UNIQUE(sos_request_id, doctor_id) after, so a ring that
 * re-discovers an already-offered doctor just skips them.
 *
 * Run: npm run test  (needs a live MySQL — see tests/helpers/db.ts)
 */

import "dotenv/config";

import { test } from "node:test";
import assert from "node:assert/strict";
import { and, eq } from "drizzle-orm";
import { withCleanFixtures } from "../../../tests/helpers/db";
import { makeClinic, makeUser } from "../../../tests/helpers/fixtures";
import { db } from "@/lib/db";
import { sosOffers, sosRequests, users } from "@/lib/db/schema";
import { escalateStaleRequest } from "../escalation";
import { SOS_OFFER_TTL_MIN, SOS_MAX_ESCALATION_ROUND } from "@/lib/config";

/** Patient's coordinates — Bengaluru, well away from the fixture doctors. */
const PATIENT_LAT = "12.9716";
const PATIENT_LNG = "77.5946";

/** A far-ring doctor only discoverable once the search widens. */
const FAR_LAT = "12.9716";
const FAR_LNG = "77.7510"; // ~17 km east — inside round 2 of a 10 km base

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000);

/** An on-duty doctor whose own GPS sits at the given coordinates. */
async function makeOnDutyDoctor(coords: { lat: string; lng: string }, name: string) {
  const doctorId = await makeUser({ role: "doctor", name });
  const clinicId = await makeClinic(doctorId);
  // Both the duty flag and the doctor's own GPS in one write. The clinic is
  // created coordinate-less on purpose: discovery then falls back to the
  // doctor's own position, which is the mobile path.
  await db
    .update(users)
    .set({ onDuty: true, latitude: coords.lat, longitude: coords.lng })
    .where(eq(users.id, doctorId));
  return { doctorId, clinicId };
}

/** A pending request for `patientId`, created `ageMinutes` ago, at some round. */
async function makePendingRequest(
  patientId: number,
  opts: { ageMinutes: number; round?: number; lastEscalatedAt?: Date | null; radiusKm?: number }
) {
  const [req] = await db
    .insert(sosRequests)
    .values({
      patientId,
      latitude: PATIENT_LAT,
      longitude: PATIENT_LNG,
      radiusKm: opts.radiusKm ?? 10,
      status: "pending",
      escalationRound: opts.round ?? 0,
      lastEscalatedAt: opts.lastEscalatedAt ?? null,
      createdAt: minutesAgo(opts.ageMinutes),
    })
    .$returningId();
  return Number(req.id);
}

/** Offer rows currently standing for a request. */
async function offerDoctorIds(requestId: number): Promise<number[]> {
  const rows = await db
    .select({ doctorId: sosOffers.doctorId })
    .from(sosOffers)
    .where(eq(sosOffers.sosRequestId, requestId));
  return rows.map((r) => r.doctorId);
}

test("escalation: a request whose offer set is still fresh is not widened", async () => {
  await withCleanFixtures(async () => {
    const patientId = await makeUser({ role: "patient" });
    const requestId = await makePendingRequest(patientId, {
      ageMinutes: SOS_OFFER_TTL_MIN / 2,
    });

    const outcome = await escalateStaleRequest(requestId);
    assert.equal(outcome.kind, "no-op");
    if (outcome.kind === "no-op") assert.equal(outcome.reason, "recent");
    // Round must not have advanced.
    const [row] = await db
      .select()
      .from(sosRequests)
      .where(eq(sosRequests.id, requestId))
      .limit(1);
    assert.equal(row?.escalationRound, 0);
    assert.equal(row?.lastEscalatedAt, null);
  });
});

test("escalation: the round advances after the offer TTL even when nobody is found", async () => {
  await withCleanFixtures(async () => {
    const patientId = await makeUser({ role: "patient" });
    // Old enough that its round-0 offer set has timed out, young enough that
    // the request TTL has NOT expired it. No doctor is in range at any
    // radius, which is the point: the clock moves regardless, so the NEXT
    // factor gets a turn instead of the sweep spinning on the same interval.
    const requestId = await makePendingRequest(patientId, { ageMinutes: 3 });

    const outcome = await escalateStaleRequest(requestId);
    // `no-candidates` — nobody at 15 km either.
    assert.equal(outcome.kind, "no-op");
    if (outcome.kind === "no-op") assert.equal(outcome.reason, "no-candidates");

    const [row] = await db
      .select()
      .from(sosRequests)
      .where(eq(sosRequests.id, requestId))
      .limit(1);
    assert.equal(row?.escalationRound, 1, "the round must advance past the failed search");
    assert.ok(row?.lastEscalatedAt, "the round's own clock must be recorded");
  });
});

test("escalation: terminal states are never widened", async () => {
  await withCleanFixtures(async () => {
    const patientId = await makeUser({ role: "patient" });

    for (const status of ["accepted", "cancelled", "completed", "expired"] as const) {
      const [req] = await db
        .insert(sosRequests)
        .values({
          patientId,
          latitude: PATIENT_LAT,
          longitude: PATIENT_LNG,
          status,
          createdAt: minutesAgo(3),
        })
        .$returningId();
      const requestId = Number(req.id);

      const outcome = await escalateStaleRequest(requestId);
      assert.equal(outcome.kind, "no-op", `${status} must not widen`);
      if (outcome.kind === "no-op") assert.equal(outcome.reason, "terminal");
    }
  });
});

test("escalation: stops at the max round instead of widening forever", async () => {
  await withCleanFixtures(async () => {
    const patientId = await makeUser({ role: "patient" });
    const requestId = await makePendingRequest(patientId, {
      ageMinutes: 3,
      round: SOS_MAX_ESCALATION_ROUND,
      lastEscalatedAt: minutesAgo(3),
    });

    const outcome = await escalateStaleRequest(requestId);
    assert.equal(outcome.kind, "no-op");
    if (outcome.kind === "no-op") assert.equal(outcome.reason, "max-round");

    const [row] = await db
      .select()
      .from(sosRequests)
      .where(eq(sosRequests.id, requestId))
      .limit(1);
    assert.equal(row?.escalationRound, SOS_MAX_ESCALATION_ROUND);
  });
});

test("escalation: a concurrent-sweep double escalation is refused", async () => {
  await withCleanFixtures(async () => {
    const patientId = await makeUser({ role: "patient" });
    const requestId = await makePendingRequest(patientId, { ageMinutes: 3 });
    // An in-range doctor so a successful escalation is reachable — otherwise
    // both sweeps fail at discovery and the race never engages.
    await makeOnDutyDoctor({ lat: "12.9860", lng: "77.6090" }, "Dr In Range");

    // Two sweeps racing on the same request. The conditional round advance
    // lets exactly ONE of them past the claim; the loser must not escalate
    // again. This is the same affectedRows contract `acceptSos` uses to
    // decide who takes a case, so the same test shape applies.
    const results = await Promise.all([
      escalateStaleRequest(requestId),
      escalateStaleRequest(requestId),
    ]);

    // Whichever one wins, the round landed on exactly 1 — never 2.
    const [row] = await db
      .select()
      .from(sosRequests)
      .where(eq(sosRequests.id, requestId))
      .limit(1);
    assert.equal(row?.escalationRound, 1, "two racing sweeps must not advance the round twice");

    // And the in-range doctor was offered exactly once, not twice.
    const ids = await offerDoctorIds(requestId);
    assert.deepEqual(ids.length, new Set(ids).size, "no duplicate offers from the race");
  });
});

test("escalation: a wider ring discovers doctors the original radius missed", async () => {
  await withCleanFixtures(async () => {
    const patientId = await makeUser({ role: "patient" });

    // Base radius 10 km. The far doctor sits 16.95 km away: unreachable at
    // round 0 (10 km) and round 1 (15 km), reachable at round 2 (22.5 km).
    const requestId = await makePendingRequest(patientId, { ageMinutes: 3, radiusKm: 10 });
    const far = await makeOnDutyDoctor({ lat: FAR_LAT, lng: FAR_LNG }, "Dr Far Ring");
    assert.deepEqual(await offerDoctorIds(requestId), [], "no offers before any sweep");

    // Round 1 lands at 15 km — 1.95 km short. This is the honest case, and it
    // is worth pinning exactly: the round is ADVANCED (so the timestamp moves
    // and the next factor gets its own turn) but NO body is found, so the
    // outcome is `no-candidates` rather than `escalated`. The distinction
    // matters because the sweep must not report "we widened and found
    // somebody" when it found nobody.
    const first = await escalateStaleRequest(requestId);
    assert.equal(first.kind, "no-op");
    if (first.kind === "no-op") assert.equal(first.reason, "no-candidates");

    // The round counter still moved — that is what stops a failed escalation
    // from burning the whole budget on the same interval.
    const [afterFirst] = await db
      .select()
      .from(sosRequests)
      .where(eq(sosRequests.id, requestId))
      .limit(1);
    assert.equal(afterFirst?.escalationRound, 1, "a failed round still advances");
    assert.deepEqual(await offerDoctorIds(requestId), [], "15 km still reaches nobody");

    // Age the round-1 offer set past the TTL so round 2 is due.
    const aged = await db
      .update(sosRequests)
      .set({ lastEscalatedAt: minutesAgo(3) })
      .where(eq(sosRequests.id, requestId));
    assert.equal(aged[0].affectedRows, 1);

    const second = await escalateStaleRequest(requestId);
    assert.equal(second.kind, "escalated");
    if (second.kind === "escalated") {
      assert.equal(second.round, 2);
      assert.equal(second.radiusKm, 22.5);
      assert.equal(second.newDoctors, 1, "22.5 km finally reaches the far doctor");
    }
    assert.deepEqual(
      await offerDoctorIds(requestId),
      [far.doctorId],
      "the far doctor must now hold exactly one offer"
    );
  });
});

test("escalation: an already-offered doctor is never re-offered by a wider ring", async () => {
  await withCleanFixtures(async () => {
    const patientId = await makeUser({ role: "patient" });
    const requestId = await makePendingRequest(patientId, { ageMinutes: 3, radiusKm: 10 });

    // A doctor INSIDE the base radius, so round 0 would already have found
    // them. They were offered at round 0 and their row is re-issued by hand
    // here to stand in for the trigger-time insert.
    const inside = await makeOnDutyDoctor({ lat: "12.9860", lng: "77.6090" }, "Dr Inside Ring");
    await db
      .insert(sosOffers)
      .values({ sosRequestId: requestId, doctorId: inside.doctorId, status: "broadcast" });

    const outcome = await escalateStaleRequest(requestId);
    assert.equal(outcome.kind, "escalated");

    // The wider ring necessarily re-discovers the inside doctor. They must be
    // skipped, not duplicated — the UNIQUE constraint would reject a second
    // row, and re-notifying them would send a second push for one emergency.
    const ids = await offerDoctorIds(requestId);
    assert.equal(ids.length, 1, "no duplicate offer for the same doctor");
    assert.deepEqual(ids, [inside.doctorId]);
    assert.equal(
      ids.filter((id) => id === inside.doctorId).length,
      1,
      "the inside doctor is offered exactly once across both rounds"
    );
  });
});

test("escalation: an expired request is never resurrected by a sweep", async () => {
  await withCleanFixtures(async () => {
    const patientId = await makeUser({ role: "patient" });
    // Older than the request TTL, so the expiry sweep has already flipped it.
    // The escalation sweep runs on the same cron, AFTER expiry, and must not
    // put an offer back in front of a doctor for a dead request.
    const requestId = await makePendingRequest(patientId, {
      ageMinutes: 10,
      radiusKm: 10,
    });
    await db
      .update(sosRequests)
      .set({ status: "expired" })
      .where(eq(sosRequests.id, requestId));

    // An in-range doctor who WOULD be offered if the sweep ran.
    await makeOnDutyDoctor({ lat: "12.9860", lng: "77.6090" }, "Dr Would Be Offered");

    const outcome = await escalateStaleRequest(requestId);
    assert.equal(outcome.kind, "no-op");
    if (outcome.kind === "no-op") assert.equal(outcome.reason, "terminal");
    assert.deepEqual(await offerDoctorIds(requestId), [], "no offer may be issued post-expiry");
  });
});
