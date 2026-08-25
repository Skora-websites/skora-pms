import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sosOffers, sosRequests, users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";
import { maskPatient } from "@/lib/dispatch/geo";

export const runtime = "nodejs";

/**
 * GET /api/doctor/sos/status
 *
 * Returns the doctor's pending broadcast offers (initial load / polling
 * fallback when SSE is not available). This endpoint also acts as a
 * business-TTL expiry on read: stale pending requests are expired inline
 * so no stale accept can happen.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !["doctor", "receptionist", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;

  const rows = await db
    .select({
      requestId: sosOffers.sosRequestId,
      distanceKm: sosOffers.distanceKm,
      status: sosOffers.status,
      offerStatus: sosOffers.status,
      complaint: sosRequests.complaint,
      patientName: users.name,
      requestStatus: sosRequests.status,
      createdAt: sosRequests.createdAt,
    })
    .from(sosOffers)
    .innerJoin(sosRequests, eq(sosRequests.id, sosOffers.sosRequestId))
    .innerJoin(users, eq(users.id, sosRequests.patientId))
    .where(and(eq(sosOffers.doctorId, doctorId), eq(sosOffers.status, "broadcast"), eq(sosRequests.status, "pending")))
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