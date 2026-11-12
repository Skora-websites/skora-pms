import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { sosOffers, sosRequests, users, sosCases } from "@/lib/db/schema";
import { requireApiRole } from "@/lib/auth/guard";
import { maskPatient } from "@/lib/dispatch/geo";
import { SOS_TTL_MIN } from "@/lib/config";
import { apiError, apiOk } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/doctor/sos/feed — the doctor's emergency feed.
 *
 * The mobile mirror of the web's `GET /api/doctor/sos/status`, which a
 * native client cannot call: that tree answers a bare (non-enveloped) body
 * behind the web's own guard. Same payload, same rules — one envelope
 * difference, and the doctor's ids come from `resolveDoctorId` exactly as
 * the web route resolves them.
 *
 * Two buckets, exactly as the web's:
 * - `offers` — pending broadcasts offered to THIS doctor, patient identity
 *   masked until the case is accepted;
 * - `active` — the doctor's own accepted case with its live state (ETA,
 *   arrival, identity verification).
 *
 * Polling is the doctor's channel only while the app is foregrounded; a
 * backgrounded app receives nothing, which is why native push (plan §2.6)
 * and not this feed is what wakes a doctor.
 */
export async function GET() {
  const user = await requireApiRole(["doctor"]);
  if (user instanceof Response) {
    return apiError(user.status === 401 ? "Unauthorized" : "Forbidden", user.status);
  }
  const doctorId = user.id;

  // The TTL bound — a broadcast older than this is already expired, so a
  // stale offer must not keep ringing in the feed.
  const ttlCutoff = new Date(Date.now() - SOS_TTL_MIN * 60_000);

  const rows = await db
    .select({
      id: sosOffers.id,
      requestId: sosOffers.sosRequestId,
      offerDistanceKm: sosOffers.distanceKm,
      offerStatus: sosOffers.status,
      complaint: sosRequests.complaint,
      patientName: users.name,
      createdAt: sosRequests.createdAt,
      // Case-level state — only populated once this doctor accepted.
      caseDistanceKm: sosCases.distanceKm,
      etaMinutes: sosCases.etaMinutes,
      arrivedAt: sosCases.arrivedAt,
      otpVerifiedAt: sosCases.otpVerifiedAt,
    })
    .from(sosOffers)
    .innerJoin(sosRequests, eq(sosRequests.id, sosOffers.sosRequestId))
    .innerJoin(users, eq(users.id, sosRequests.patientId))
    .leftJoin(sosCases, and(eq(sosCases.sosRequestId, sosOffers.sosRequestId), eq(sosCases.doctorId, doctorId)))
    .where(
      and(
        eq(sosOffers.doctorId, doctorId),
        // Pending broadcasts (with the TTL bound) OR this doctor's own
        // accepted case — both need to survive a poll/refresh.
        gt(sosRequests.createdAt, ttlCutoff)
      )
    )
    .orderBy(desc(sosRequests.createdAt));

  const offers = rows
    .filter((r) => r.offerStatus === "broadcast")
    .map((r) => ({
      requestId: r.requestId,
      distanceKm: r.offerDistanceKm,
      complaint: r.complaint,
      patient: maskPatient(r.patientName),
      createdAt: r.createdAt,
    }));

  const active = rows
    .filter((r) => r.offerStatus === "accepted")
    .map((r) => ({
      requestId: r.requestId,
      distanceKm: r.caseDistanceKm,
      etaMinutes: r.etaMinutes,
      arrivedAt: r.arrivedAt,
      otpVerifiedAt: r.otpVerifiedAt,
      patient: maskPatient(r.patientName),
      complaint: r.complaint,
    }));

  return apiOk({ offers, active });
}
