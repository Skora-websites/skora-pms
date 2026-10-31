import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { billings, sosCases, sosOffers, sosRequests, users } from "@/lib/db/schema";
import { getMyActiveCase } from "@/lib/dispatch/actions";
import { requireApiRole } from "@/lib/auth/guard";
import { apiError, apiOk, redirectError } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/emergency/requests/[id]/case — doctor-side case detail.
 *
 * Closes the FR-023 gap: `GET /api/doctor/sos/status` carries neither the
 * patient's phone nor their live coordinates for an accepted case. This route
 * returns the full identity, contact number and live position the doctor
 * needs after accepting, plus the arrival/OTP/billing state.
 *
 * Guard: the existing doctor-only API guard (`requireApiRole(["doctor"])` is
 * the guard `app/api/doctor/sos/status/route.ts` uses) — no non-doctor role
 * passes, so a receptionist is never resolved to a practice owner.
 *
 * Ownership: the doctor must hold an `sos_offers` row for this request. That
 * is the same offer-ownership check `acceptSos` performs before it will
 * claim a request, expressed with the unique `(sos_request_id, doctor_id)`
 * index that already exists. A doctor with no offer for this request gets
 * 404 — indistinguishable from a genuine miss, matching the service's
 * existing ownership convention.
 *
 * A case that this doctor has NOT yet accepted (offer still `broadcast`, or
 * another doctor won the race) returns 404: the patient's identity is
 * intentionally not exposed to a doctor who does not hold the case.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiRole(["doctor"]);
  if (user instanceof Response) return user;
  const doctorId = user.id;

  const { id } = await params;
  const requestId = Number(id);
  if (!Number.isInteger(requestId)) {
    return apiError("Invalid request", 400);
  }

  // Offer ownership — the (sos_request_id, doctor_id) unique index.
  const [offer] = await db
    .select({ id: sosOffers.id })
    .from(sosOffers)
    .where(and(eq(sosOffers.sosRequestId, requestId), eq(sosOffers.doctorId, doctorId)))
    .limit(1);
  if (!offer) return apiError("Not found", 404);

  // Case ownership + live state, from the existing helper the doctor panel
  // already uses for its active case. It is scoped to THIS doctor's own open
  // case, so a doctor who lost the race gets `null` → 404.
  let caseRow;
  try {
    caseRow = await getMyActiveCase();
  } catch (err) {
    const mapped = redirectError(err);
    if (mapped) return mapped;
    return apiError("Could not load the case", 500);
  }
  if (!caseRow || caseRow.sosRequestId !== requestId) {
    return apiError("Not found", 404);
  }

  const [row] = await db
    .select({
      complaint: sosRequests.complaint,
      patientNotes: sosRequests.patientNotes,
      patientName: users.name,
      patientPhone: users.phone,
      billingId: sosCases.billingId,
      fare: billings.totalAmount,
    })
    .from(sosRequests)
    .innerJoin(users, eq(users.id, sosRequests.patientId))
    .innerJoin(
      sosCases,
      and(eq(sosCases.sosRequestId, sosRequests.id), eq(sosCases.doctorId, doctorId))
    )
    .leftJoin(billings, eq(billings.id, sosCases.billingId))
    .where(eq(sosRequests.id, requestId))
    .limit(1);

  return apiOk({
    requestId,
    patient: { name: row?.patientName ?? null, phone: row?.patientPhone ?? null },
    patientLatitude: caseRow.patientLatitude,
    patientLongitude: caseRow.patientLongitude,
    complaint: row?.complaint ?? null,
    patientNotes: row?.patientNotes ?? null,
    distanceKm: caseRow.distanceKm,
    etaMinutes: caseRow.etaMinutes,
    arrivedAt: caseRow.arrivedAt,
    otpVerifiedAt: caseRow.otpVerifiedAt,
    billingId: row?.billingId ?? null,
    fare: row?.fare ?? null,
  });
}
