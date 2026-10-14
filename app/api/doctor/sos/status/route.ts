import { NextResponse } from "next/server";
import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { sosOffers, sosRequests, users, sosCases } from "@/lib/db/schema";
import { requireApiDoctorOnly } from "@/lib/auth/guard";
import { maskPatient, resolveDoctorId, SOS_TTL_MIN } from "@/lib/dispatch/geo";

export const runtime = "nodejs";

/**
 * GET /api/doctor/sos/status
 *
 * Returns the doctor's pending broadcast offers (polling fallback when
 * SSE is not available). Stale requests past the business TTL are
 * filtered out so no stale accept can happen. Accepted rows carry the
 * live case state (arrival / identity / ETA) for the emergency panel.
 * The OTP is intentionally absent: the plaintext never leaves acceptSos.
 */
export async function GET() {
  // Doctor-only panel (audit F-02): the doctor layout hard-bounces
  // receptionists from /doctor/emergency regardless of permissions — a
  // deliberate product boundary the underlying endpoint must share.
  const user = await requireApiDoctorOnly();
  if (user instanceof Response) return user;
  const doctorId = resolveDoctorId(user);

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

  return NextResponse.json({ offers, active });
}