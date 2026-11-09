import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sosRequests, sosCases, users, billings } from "@/lib/db/schema";
import { expireStalePendingRequest } from "@/lib/dispatch/expiry";
import { sweepPendingRequest } from "@/lib/dispatch/discovery";
import { escalateStaleRequest } from "@/lib/dispatch/escalation";
import { requirePatientActor } from "@/app/api/mobile/_helpers";
import { apiError, apiOk } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/patient/sos/status/{id} — the patient's live SOS tracker.
 *
 * The mobile mirror of the web's `GET /api/patient/sos/status/[id]`
 * (app/api/patient/sos/status/[id]/route.ts), which the native client
 * cannot call: that tree is under the web's own session guard and returns a
 * bare JSON body, not the `{ data }` envelope every `/api/mobile/**` route
 * answers with. The payload and every rule below are identical — the plan
 * (§2.5) requires the tracker to poll the server, which stays authoritative.
 *
 * Ownership: only the patient who created the request can see it. Any other
 * patient gets a 404 indistinguishable from a genuine miss, so the id space
 * is not a discovery oracle.
 *
 * The plaintext OTP is never re-served by a read route; `patientOtp` stays
 * server-side and only leaves inside `acceptSos`'s response to the doctor.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requirePatientActor();
  if (user instanceof Response) return user;

  const { id } = await params;
  const requestId = Number(id);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return apiError("Invalid request.", 400);
  }

  const [req] = await db
    .select()
    .from(sosRequests)
    .where(eq(sosRequests.id, requestId))
    .limit(1);
  if (!req || req.patientId !== user.id) {
    // IDOR-safe: another patient's request looks exactly like a miss.
    return apiError("Emergency request not found.", 404);
  }

  // Business-TTL expiry on read: a stale pending request is expired inline so
  // the patient sees "no doctor available" instead of waiting forever (the
  // doctor accept path enforces the same TTL).
  let status = req.status;
  if (status === "pending") {
    if (await expireStalePendingRequest(requestId)) {
      status = "expired";
    } else {
      // Late-joiner sweep: still pending, periodically re-run nearby
      // discovery so doctors who went on-duty after the broadcast get it.
      void sweepPendingRequest(requestId);
      // Offer-timeout escalation (audit P5): same rule as the web tracker —
      // if the current offer set is older than SOS_OFFER_TTL_MIN with no
      // accept, widen the ring rather than letting the patient wait out the
      // whole request TTL. The native app cannot hold an SSE stream as
      // reliably as the web panel, so this poll is if anything MORE
      // load-bearing here.
      void escalateStaleRequest(requestId);
    }
  }

  let doctor: {
    name: string | null;
    phone: string | null;
    /** Raw varchar coordinates from `sos_cases`, coerced below. */
    liveLatitude: string | null;
    liveLongitude: string | null;
    lastSeenAt: Date | null;
    caseStatus: string | null;
  } | null = null;
  // Case-level parity fields (ETA, arrival, identity, rating, billing).
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

  return apiOk({
    id: req.id,
    status,
    complaint: req.complaint,
    createdAt: req.createdAt,
    // `latitude`/`longitude` are varchar in the schema (the web route passes
    // them through raw); the native client's zod schema declares numbers, so
    // coerce here rather than loosen the app's contract.
    patientLatitude: toNumberOrNull(req.latitude),
    patientLongitude: toNumberOrNull(req.longitude),
    doctor: doctor && {
      ...doctor,
      // `doctor_latitude`/`doctor_longitude` are varchar too.
      liveLatitude: toNumberOrNull(String(doctor.liveLatitude ?? "")),
      liveLongitude: toNumberOrNull(String(doctor.liveLongitude ?? "")),
    },
    etaMinutes,
    distanceKm,
    arrivedAt,
    otpVerifiedAt,
    rating,
    billingId,
    fare,
  });
}

/** A varchar coordinate → number, or null when absent/unparsable. */
function toNumberOrNull(value: string | null): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
