import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments, appointmentConsultConsents, users } from "@/lib/db/schema";
import { apiError, apiOk, requireDoctorActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/doctor/appointments/[id]/consent
 * Allows doctors to verify whether a patient has signed informed consent
 * before initiating a consultation or video call.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const doctor = await requireDoctorActor();
  if (doctor instanceof Response) return doctor;

  const { id } = await params;
  const appointmentId = Number(id);
  if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
    return apiError("Invalid appointment ID.", 400);
  }

  const [appt] = await db
    .select({
      id: appointments.id,
      patientId: appointments.patientId,
      doctorId: appointments.doctorId,
      date: appointments.date,
      time: appointments.time,
      caseType: appointments.caseType,
      status: appointments.status,
      consentType: appointments.consentType,
      consentValue: appointments.consentValue,
      patientName: users.name,
      patientPhone: users.phone,
    })
    .from(appointments)
    .innerJoin(users, eq(users.id, appointments.patientId))
    .where(
      and(
        eq(appointments.id, appointmentId),
        eq(appointments.doctorId, doctor.id)
      )
    );

  if (!appt) {
    return apiError("Appointment not found or not assigned to you.", 404);
  }

  const [consentRow] = await db
    .select()
    .from(appointmentConsultConsents)
    .where(eq(appointmentConsultConsents.appointmentId, appointmentId))
    .limit(1);

  const isAccepted = Boolean(
    consentRow?.isAccepted || appt.consentValue === "signed_in_app"
  );

  return apiOk({
    appointmentId,
    patientId: appt.patientId,
    patientName: appt.patientName,
    date: appt.date,
    time: appt.time,
    caseType: appt.caseType,
    isAccepted,
    acceptedAt: consentRow?.acceptedAt
      ? consentRow.acceptedAt.toISOString()
      : isAccepted
      ? new Date().toISOString()
      : null,
    status: isAccepted ? "confirmed" : "pending",
  });
}
