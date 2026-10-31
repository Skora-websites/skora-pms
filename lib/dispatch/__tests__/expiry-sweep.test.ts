/**
 * Bulk SOS expiry sweep — the cron path.
 *
 * `expireStalePendingRequest` only expires one request the system already
 * knows about. Stale requests nobody polls for (a patient closed the tab, the
 * app was killed) would sit pending forever, holding doctor offers open. The
 * sweep finds and expires all of them, so a patient never waits past the TTL
 * and doctors are never dispatched to a corpse.
 */

import "dotenv/config";

import { test } from "node:test";
import assert from "node:assert/strict";
import { and, eq } from "drizzle-orm";
import { withCleanFixtures } from "../../../tests/helpers/db";
import { makeUser } from "../../../tests/helpers/fixtures";
import { db } from "@/lib/db";
import { sosOffers, sosRequests } from "@/lib/db/schema";
import { expireStalePendingRequests } from "../expiry";

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000);

/** A pending request owned by `patientId`, created `ageMinutes` ago. */
const makeRequest = async (patientId: number, ageMinutes: number) =>
  (
    await db
      .insert(sosRequests)
      .values({
        patientId,
        latitude: "28.6139",
        longitude: "77.2090",
        complaint: "chest pain",
        createdAt: minutesAgo(ageMinutes),
      })
      .$returningId()
  )[0].id;

const makeOffer = (requestId: number, doctorId: number) =>
  db.insert(sosOffers).values({ sosRequestId: requestId, doctorId, status: "broadcast" });

const statusOf = async (id: number) => {
  const rows = await db
    .select({ status: sosRequests.status })
    .from(sosRequests)
    .where(eq(sosRequests.id, id));
  return rows[0]?.status;
};

const offersLeft = async (id: number) =>
  (
    await db
      .select({ status: sosOffers.status })
      .from(sosOffers)
      .where(eq(sosOffers.sosRequestId, id))
  ).filter((o) => o.status === "broadcast").length;

test("a stale pending request is expired and its open offers with it", async () => {
  await withCleanFixtures(async () => {
    const patient = await makeUser({ role: "patient", name: "Sweep Patient" });
    const doctor = await makeUser({ role: "doctor", name: "Sweep Doctor" });
    const stale = await makeRequest(patient, 30);
    await makeOffer(stale, doctor);

    const expired = await expireStalePendingRequests();

    assert.ok(expired >= 1, "the sweep reports what it flipped");
    assert.equal(await statusOf(stale), "expired");
    assert.equal(await offersLeft(stale), 0, "no doctor stays dispatched to a dead request");
  });
});

test("a fresh pending request is left alone", async () => {
  await withCleanFixtures(async () => {
    const patient = await makeUser({ role: "patient", name: "Sweep Patient" });
    const fresh = await makeRequest(patient, 1);

    await expireStalePendingRequests();

    assert.equal(await statusOf(fresh), "pending");
  });
});

test("a stale request that was already cancelled or accepted is not rewritten", async () => {
  await withCleanFixtures(async () => {
    const patient = await makeUser({ role: "patient", name: "Sweep Patient" });
    const cancelled = await makeRequest(patient, 30);
    const accepted = await makeRequest(patient, 30);
    await db.update(sosRequests).set({ status: "cancelled" }).where(eq(sosRequests.id, cancelled));
    await db.update(sosRequests).set({ status: "accepted" }).where(eq(sosRequests.id, accepted));

    await expireStalePendingRequests();

    assert.equal(await statusOf(cancelled), "cancelled", "expiry never overwrites a resolution");
    assert.equal(await statusOf(accepted), "accepted");
  });
});

test("expiring is idempotent: a second sweep finds nothing left", async () => {
  await withCleanFixtures(async () => {
    const patient = await makeUser({ role: "patient", name: "Sweep Patient" });
    await makeRequest(patient, 30);

    const first = await expireStalePendingRequests();
    const second = await expireStalePendingRequests();

    assert.ok(first >= 1);
    assert.equal(second, 0, "already-expired rows are not counted twice");
  });
});

test("only pending requests are touched, whatever else is in the table", async () => {
  await withCleanFixtures(async () => {
    const patient = await makeUser({ role: "patient", name: "Sweep Patient" });
    const completed = await makeRequest(patient, 30);
    await db.update(sosRequests).set({ status: "completed" }).where(eq(sosRequests.id, completed));

    await expireStalePendingRequests();

    assert.equal(await statusOf(completed), "completed");
    // sanity: the guard really is the status column, not the row age
    const others = await db
      .select()
      .from(sosRequests)
      .where(and(eq(sosRequests.patientId, patient)));
    assert.equal(others.length, 1);
  });
});
