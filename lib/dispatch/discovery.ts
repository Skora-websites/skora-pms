import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sosOffers, sosRequests, users } from "@/lib/db/schema";
import { findNearbyOnDutyDoctors, maskPatient, type NearbyDoctor } from "./geo";
import { announceSosToDoctors } from "./hub";

/**
 * Late-joiner re-discovery sweep for pending SOS requests.
 *
 * While a request is still pending, re-run nearby-doctor discovery so that
 * doctors who went on-duty AFTER the original broadcast also receive it
 * (the initial offer set is a snapshot of who was on-duty at trigger time).
 * Offers are created idempotently (UNIQUE(sos_request_id, doctor_id)) and
 * only genuinely new doctors get the live event, notification, and push.
 *
 * Throttled per request via an in-memory map: one sweep per ~20s per
 * request regardless of how many doctors poll. Driven by the patient's
 * status poll — the motivated poller — so no cron/infra is needed.
 * For multi-instance deployments the throttle degrades gracefully: each
 * instance sweeps at most once per interval, and the UNIQUE constraint
 * keeps the result correct.
 */

const SWEEP_INTERVAL_MS = 20_000;
const lastSweepAt = new Map<number, number>();

/** Reset the in-memory throttle (used by tests). */
export function resetSweepThrottleForTests() {
  lastSweepAt.clear();
}

/**
 * Re-run discovery for a pending request; returns true if any new doctor
 * was offered the request.
 */
export async function sweepPendingRequest(requestId: number): Promise<boolean> {
  const now = Date.now();
  const last = lastSweepAt.get(requestId);
  if (last !== undefined && now - last < SWEEP_INTERVAL_MS) return false;
  lastSweepAt.set(requestId, now);

  const [req] = await db
    .select({
      id: sosRequests.id,
      patientId: sosRequests.patientId,
      latitude: sosRequests.latitude,
      longitude: sosRequests.longitude,
      radiusKm: sosRequests.radiusKm,
      complaint: sosRequests.complaint,
    })
    .from(sosRequests)
    .where(and(eq(sosRequests.id, requestId), eq(sosRequests.status, "pending")))
    .limit(1);
  if (!req) return false;

  const nearby = await findNearbyOnDutyDoctors(
    Number(req.latitude),
    Number(req.longitude),
    req.radiusKm ?? 10
  );
  if (nearby.length === 0) return false;

  // Which of these doctors do NOT yet have an offer for this request?
  const existing = await db
    .select({ doctorId: sosOffers.doctorId })
    .from(sosOffers)
    .where(eq(sosOffers.sosRequestId, requestId));
  const existingSet = new Set(existing.map((r) => r.doctorId));
  const newDoctors = nearby.filter((d) => !existingSet.has(d.doctorId));
  if (newDoctors.length === 0) return false;

  const inserted: NearbyDoctor[] = [];
  for (const doc of newDoctors) {
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
  if (inserted.length === 0) return false;

  const [patient] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, req.patientId))
    .limit(1);
  const masked = maskPatient(patient?.name ?? "Patient");

  await announceSosToDoctors(
    inserted.map((d) => d.doctorId),
    {
      requestId,
      distanceKm: inserted[0].distanceKm,
      complaint: req.complaint,
      patient: masked,
    }
  );
  return true;
}
