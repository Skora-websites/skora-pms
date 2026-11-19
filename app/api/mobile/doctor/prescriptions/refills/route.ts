import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { consultations, prescriptionRefillRequests, users } from "@/lib/db/schema";
import { apiError, apiOk, requireDoctorActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/doctor/prescriptions/refills — doctor's patient refill requests.
 */
export async function GET() {
  const user = await requireDoctorActor();
  if (user instanceof Response) return user;

  const rows = await db
    .select({
      id: prescriptionRefillRequests.id,
      consultationId: prescriptionRefillRequests.consultationId,
      patientId: prescriptionRefillRequests.patientId,
      patientName: users.name,
      patientPhone: users.phone,
      patientGender: users.gender,
      patientDob: users.dob,
      medicationName: prescriptionRefillRequests.medicationName,
      quantity: prescriptionRefillRequests.quantity,
      note: prescriptionRefillRequests.note,
      status: prescriptionRefillRequests.status,
      resolvedAt: prescriptionRefillRequests.resolvedAt,
      createdAt: prescriptionRefillRequests.createdAt,
      diagnosisNote: consultations.diagnosisNote,
      consultationDate: consultations.consultationDate,
    })
    .from(prescriptionRefillRequests)
    .innerJoin(users, eq(users.id, prescriptionRefillRequests.patientId))
    .innerJoin(consultations, eq(consultations.id, prescriptionRefillRequests.consultationId))
    .where(eq(prescriptionRefillRequests.doctorId, user.id))
    .orderBy(desc(prescriptionRefillRequests.createdAt));

  const items = rows.map((r) => ({
    id: r.id,
    consultationId: r.consultationId,
    patientId: r.patientId,
    patientName: r.patientName || "Patient",
    patientPhone: r.patientPhone || null,
    patientGender: r.patientGender || null,
    patientDob: r.patientDob || null,
    medicationName: r.medicationName || "Medication",
    quantity: r.quantity ?? 1,
    note: r.note || null,
    status: r.status,
    diagnosisNote: r.diagnosisNote || null,
    consultationDate: r.consultationDate ? r.consultationDate.toISOString() : null,
    resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  }));

  return apiOk(items);
}
