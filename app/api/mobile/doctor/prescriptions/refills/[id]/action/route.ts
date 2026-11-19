import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { prescriptionRefillRequests, users } from "@/lib/db/schema";
import { apiError, apiOk, csrfGuard, requireDoctorActor } from "@/app/api/mobile/_helpers";
import { notifyUser } from "@/lib/notifications/service";

export const runtime = "nodejs";

/**
 * POST /api/mobile/doctor/prescriptions/refills/[id]/action
 * Doctor resolves a prescription refill request (`action`: "approve" | "reject").
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireDoctorActor();
  if (user instanceof Response) return user;

  const csrf = csrfGuard(request);
  if (csrf) return csrf;

  const { id } = await params;
  const refillId = Number(id);
  if (!refillId || isNaN(refillId)) {
    return apiError("Invalid refill request ID.", 400);
  }

  let body: { action?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body.", 400);
  }

  const { action, note } = body;
  if (action !== "approve" && action !== "reject") {
    return apiError("Action must be either 'approve' or 'reject'.", 400);
  }

  // Find the request belonging to this doctor
  const [refill] = await db
    .select({
      id: prescriptionRefillRequests.id,
      patientId: prescriptionRefillRequests.patientId,
      doctorId: prescriptionRefillRequests.doctorId,
      medicationName: prescriptionRefillRequests.medicationName,
      status: prescriptionRefillRequests.status,
    })
    .from(prescriptionRefillRequests)
    .where(
      and(
        eq(prescriptionRefillRequests.id, refillId),
        eq(prescriptionRefillRequests.doctorId, user.id)
      )
    )
    .limit(1);

  if (!refill) {
    return apiError("Refill request not found.", 404);
  }

  const newStatus = action === "approve" ? "approved" : "rejected";
  const doctorNote = note && typeof note === "string" ? note.trim().slice(0, 500) : null;

  await db
    .update(prescriptionRefillRequests)
    .set({
      status: newStatus,
      resolvedAt: new Date(),
      resolvedBy: user.id,
      updatedAt: new Date(),
    })
    .where(eq(prescriptionRefillRequests.id, refillId));

  // Notify the patient immediately
  if (refill.patientId) {
    try {
      const isApproved = newStatus === "approved";
      const title = isApproved
        ? "✅ Prescription Refill Approved"
        : "❌ Refill Request Not Approved";

      const message = isApproved
        ? `Dr. ${user.name || "Doctor"} approved your refill for ${refill.medicationName || "your medication"}.${
            doctorNote ? ` Instructions: ${doctorNote}` : " You may now collect it from the pharmacy."
          }`
        : `Dr. ${user.name || "Doctor"} did not approve your refill for ${refill.medicationName || "your medication"}.${
            doctorNote ? ` Reason: ${doctorNote}` : " Please schedule a follow-up consultation."
          }`;

      await notifyUser({
        userId: refill.patientId,
        title,
        message,
        type: "prescription_refill",
        link: "/patient/prescriptions",
      });
    } catch (err) {
      console.error("Failed to notify patient about refill decision:", err);
    }
  }

  return apiOk({
    id: refillId,
    status: newStatus,
    resolvedAt: new Date().toISOString(),
  });
}
