import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sosRequests, sosCases, users, billings } from "@/lib/db/schema";
import { requireApiRole } from "@/lib/auth/guard";
import { expireStalePendingRequest } from "@/lib/dispatch/expiry";
import { sweepPendingRequest } from "@/lib/dispatch/discovery";
import { escalateStaleRequest } from "@/lib/dispatch/escalation";

export const runtime = "nodejs";

/**
 * GET /api/patient/sos/status/[id]
 *
 * Live status tracker for the patient's own SOS request.
 * Ownership check: only the patient who created the request can see it
 * (IDOR-safe — any other patient gets a 404).
 *
 * When the request is accepted, also returns the doctor's LIVE location
 * (updated by the doctor while en route) for the map tracking view.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Patient-only by role; ownership is checked against the request row below.
  // requireApiPermission is wrong here — the patient owns the case and holds
  // no module permissions.
  const user = await requireApiRole(["patient"]);
  if (user instanceof Response) return user;
  const { id } = await params;
  const requestId = Number(id);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const [req] = await db
    .select()
    .from(sosRequests)
    .where(eq(sosRequests.id, requestId))
    .limit(1);
  if (!req || req.patientId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Business-TTL expiry on read: a stale pending request is expired inline
  // so the patient sees "no doctor available" instead of waiting forever
  // (the doctor accept path enforces the same TTL).
  if (req.status === "pending") {
    if (await expireStalePendingRequest(requestId)) {
      req.status = "expired";
    } else {
      // Late-joiner sweep: still pending, periodically re-run nearby
      // discovery so doctors who went on-duty after the broadcast get it.
      void sweepPendingRequest(requestId);
      // Offer-timeout escalation (audit P5): if the CURRENT offer set has
      // stood longer than SOS_OFFER_TTL_MIN with no accept, widen the ring
      // rather than letting the patient wait out the whole request TTL
      // staring at an offer set that was frozen at trigger time.
      //
      // Runs on the same poll the sweep runs on — the patient is the
      // motivated poller, so no extra infrastructure is required, and the
      // same reasoning as the sweep applies to multi-instance: each instance
      // escalates at most once per interval and the conditional round
      // advance keeps the outcome globally correct.
      void escalateStaleRequest(requestId);
    }
  }

  let doctor = null;
  // Case-level parity fields (ETA, arrival, identity, rating, billing). The
  // OTP hash is deliberately NOT re-served — `patientOtp` stays server-side.
  let etaMinutes: number | null = null;
  let distanceKm: string | null = null;
  let arrivedAt: Date | null = null;
  let otpVerifiedAt: Date | null = null;
  let rating: number | null = null;
  let billingId: number | null = null;
  let fare: number | null = null;
  if (req.acceptedBy) {
    const [d] = await db
      .select({
        name: users.name,
        phone: users.phone,
        caseLatitude: sosCases.doctorLatitude,
        caseLongitude: sosCases.doctorLongitude,
        lastSeenAt: sosCases.doctorLastSeenAt,
        caseStatus: sosCases.status,
        etaMinutes: sosCases.etaMinutes,
        distanceKm: sosCases.distanceKm,
        arrivedAt: sosCases.arrivedAt,
        otpVerifiedAt: sosCases.otpVerifiedAt,
        rating: sosCases.rating,
        billingId: sosCases.billingId,
        totalAmount: billings.totalAmount,
      })
      .from(users)
      .leftJoin(sosCases, and(eq(sosCases.sosRequestId, requestId), eq(sosCases.doctorId, req.acceptedBy)))
      .leftJoin(billings, eq(billings.id, sosCases.billingId))
      .where(eq(users.id, req.acceptedBy))
      .limit(1);
    if (d) {
      doctor = {
        name: d.name,
        phone: d.phone,
        liveLatitude: d.caseLatitude ?? null,
        liveLongitude: d.caseLongitude ?? null,
        lastSeenAt: d.lastSeenAt ?? null,
        caseStatus: d.caseStatus ?? null,
      };
      etaMinutes = d.etaMinutes ?? null;
      distanceKm = d.distanceKm ?? null;
      arrivedAt = d.arrivedAt ?? null;
      otpVerifiedAt = d.otpVerifiedAt ?? null;
      rating = d.rating ?? null;
      billingId = d.billingId ?? null;
      fare = d.totalAmount === null ? null : Number(d.totalAmount);
    }
  }

  return NextResponse.json({
    id: req.id,
    status: req.status,
    complaint: req.complaint,
    createdAt: req.createdAt,
    patientLatitude: req.latitude,
    patientLongitude: req.longitude,
    doctor,
    etaMinutes,
    distanceKm,
    arrivedAt,
    otpVerifiedAt,
    rating,
    billingId,
    fare,
  });
}
