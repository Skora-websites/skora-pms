import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { consultations, prescriptionRefillRequests, users } from "@/lib/db/schema";
import { apiError, apiOk, csrfGuard, requirePatientActor } from "@/app/api/mobile/_helpers";
import { notifyUser } from "@/lib/notifications/service";

export const runtime = "nodejs";

/**
 * GET /api/mobile/patient/prescriptions/refills — patient's refill requests history.
 */
export async function GET() {
  const user = await requirePatientActor();
  if (user instanceof Response) return user;

  const rows = await db
    .select({
      id: prescriptionRefillRequests.id,
      consultationId: prescriptionRefillRequests.consultationId,
      doctorId: prescriptionRefillRequests.doctorId,
      doctorName: users.name,
      doctorQualification: users.qualification,
      medicationName: prescriptionRefillRequests.medicationName,
      quantity: prescriptionRefillRequests.quantity,
      note: prescriptionRefillRequests.note,
      status: prescriptionRefillRequests.status,
      resolvedAt: prescriptionRefillRequests.resolvedAt,
      createdAt: prescriptionRefillRequests.createdAt,
    })
    .from(prescriptionRefillRequests)
    .innerJoin(users, eq(users.id, prescriptionRefillRequests.doctorId))
    .where(eq(prescriptionRefillRequests.patientId, user.id))
    .orderBy(desc(prescriptionRefillRequests.createdAt));

  const items = rows.map((r) => ({
    id: r.id,
    consultationId: r.consultationId,
    doctorId: r.doctorId,
    doctorName: r.doctorName || "Doctor",
    doctorQualification: r.doctorQualification || null,
    medicationName: r.medicationName || "Medication",
    quantity: r.quantity ?? 1,
    note: r.note || null,
    status: r.status,
    resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  }));

  return apiOk(items);
}

/**
 * POST /api/mobile/patient/prescriptions/refill — submit a medication refill request.
 */
export async function POST(request: Request) {
  const user = await requirePatientActor();
  if (user instanceof Response) return user;

  const csrf = csrfGuard(request);
  if (csrf) return csrf;

  let body: {
    consultationId?: number;
    medicationName?: string;
    quantity?: number;
    note?: string;
  };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body.", 400);
  }

  const { consultationId, medicationName, quantity, note } = body;
  if (!consultationId || typeof consultationId !== "number") {
    return apiError("A valid consultation ID is required.", 400);
  }
  if (!medicationName || typeof medicationName !== "string" || !medicationName.trim()) {
    return apiError("Medication name is required.", 400);
  }

  // Ensure consultation belongs to this patient
  const [consultation] = await db
    .select({
      id: consultations.id,
      doctorId: consultations.doctorId,
      patientId: consultations.patientId,
    })
    .from(consultations)
    .where(and(eq(consultations.id, consultationId), eq(consultations.patientId, user.id)))
    .limit(1);

  if (!consultation) {
    return apiError("Consultation not found or does not belong to you.", 404);
  }

  const cleanMedicationName = medicationName.trim();
  const cleanQuantity = typeof quantity === "number" && quantity > 0 && quantity <= 12 ? Math.round(quantity) : 1;
  const cleanNote = note && typeof note === "string" ? note.trim().slice(0, 500) : null;

  const [insertResult] = await db.insert(prescriptionRefillRequests).values({
    consultationId,
    patientId: user.id,
    doctorId: consultation.doctorId,
    medicationName: cleanMedicationName,
    quantity: cleanQuantity,
    note: cleanNote,
    status: "pending",
  });

  const insertedId = Number(insertResult.insertId);

  // Notify the prescribing doctor
  try {
    await notifyUser({
      userId: consultation.doctorId,
      title: "💊 Prescription Refill Request",
      message: `${user.name || "A patient"} requested a refill for ${cleanMedicationName} (${cleanQuantity} month supply).`,
      type: "prescription_refill",
      link: "/doctor/prescriptions",
    });
  } catch (err) {
    console.error("Failed to notify doctor about refill request:", err);
  }

  return apiOk({
    id: insertedId,
    status: "pending",
    medicationName: cleanMedicationName,
    quantity: cleanQuantity,
  }, { status: 201 });
}
