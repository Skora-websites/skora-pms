import { NextResponse } from "next/server";
import { and, desc, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { sosOffers, sosRequests, users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";
import { maskPatient, resolveDoctorId, SOS_TTL_MIN } from "@/lib/dispatch/geo";

export const runtime = "nodejs";

/**
 * GET /api/doctor/sos/status
 *
 * Returns the doctor's pending broadcast offers (polling fallback when
 * SSE is not available). Stale requests past the business TTL are
 * filtered out so no stale accept can happen.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !["doctor", "receptionist", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const doctorId = resolveDoctorId(user);

  const rows = await db
    .select({
      requestId: sosOffers.sosRequestId,
      distanceKm: sosOffers.distanceKm,
      complaint: sosRequests.complaint,
      patientName: users.name,
      createdAt: sosRequests.createdAt,
    })
    .from(sosOffers)
    .innerJoin(sosRequests, eq(sosRequests.id, sosOffers.sosRequestId))
    .innerJoin(users, eq(users.id, sosRequests.patientId))
    .where(
      and(
        eq(sosOffers.doctorId, doctorId),
        eq(sosOffers.status, "broadcast"),
        eq(sosRequests.status, "pending"),
        gt(sosRequests.createdAt, new Date(Date.now() - SOS_TTL_MIN * 60_000))
      )
    )
    .orderBy(desc(sosRequests.createdAt));

  return NextResponse.json({
    offers: rows.map((r) => ({
      requestId: r.requestId,
      distanceKm: r.distanceKm,
      complaint: r.complaint,
      patient: maskPatient(r.patientName),
      createdAt: r.createdAt,
    })),
  });
}