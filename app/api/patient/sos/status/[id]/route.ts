import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sosRequests, users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";

export const runtime = "nodejs";

/**
 * GET /api/patient/sos/status/[id]
 *
 * Live status tracker for the patient's own SOS request.
 * Ownership check: only the patient who created the request can see it
 * (IDOR-safe — any other patient gets a 404).
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
      .select({ name: users.name, phone: users.phone })
      .from(users)
      .where(eq(users.id, req.acceptedBy))
      .limit(1);
    doctor = d ?? null;
  }

  return NextResponse.json({
    id: req.id,
    status: req.status,
    complaint: req.complaint,
    createdAt: req.createdAt,
    doctor,
  });
}
