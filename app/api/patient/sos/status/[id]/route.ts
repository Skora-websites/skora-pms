import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sosRequests, sosCases, users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";

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
  const user = await getCurrentUser();
  if (!user || user.role !== "patient") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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

  let doctor = null;
  if (req.status === "accepted" && req.acceptedBy) {
    const [d] = await db
      .select({
        name: users.name,
        phone: users.phone,
        caseLatitude: sosCases.doctorLatitude,
        caseLongitude: sosCases.doctorLongitude,
        lastSeenAt: sosCases.doctorLastSeenAt,
        caseStatus: sosCases.status,
      })
      .from(users)
      .leftJoin(sosCases, and(eq(sosCases.sosRequestId, requestId), eq(sosCases.doctorId, req.acceptedBy)))
      .where(eq(users.id, req.acceptedBy))
      .limit(1);
    doctor = d
      ? {
          name: d.name,
          phone: d.phone,
          liveLatitude: d.caseLatitude ?? null,
          liveLongitude: d.caseLongitude ?? null,
          lastSeenAt: d.lastSeenAt ?? null,
          caseStatus: d.caseStatus ?? null,
        }
      : null;
  }

  return NextResponse.json({
    id: req.id,
    status: req.status,
    complaint: req.complaint,
    createdAt: req.createdAt,
    patientLatitude: req.latitude,
    patientLongitude: req.longitude,
    doctor,
  });
}
