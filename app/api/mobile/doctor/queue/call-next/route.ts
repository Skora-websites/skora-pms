import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments, users, doctorClinics } from "@/lib/db/schema";
import {
  apiError,
  apiOk,
  csrfGuard,
  requireDoctorModule,
} from "@/app/api/mobile/_helpers";
import { notifyUser } from "@/lib/notifications/service";

export const runtime = "nodejs";

/**
 * POST /api/mobile/doctor/queue/call-next
 * Advances the OPD queue: marks the patient as checked in and sends immediate push alerts.
 */
export async function POST(request: Request) {
  const forbidden = csrfGuard(request);
  if (forbidden) return forbidden;

  const doctor = await requireDoctorModule("dashboard");
  if (doctor instanceof Response) return doctor;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON payload.", 400);
  }

  const raw = (body ?? {}) as Record<string, unknown>;
  const appointmentId = Number(raw.appointmentId);
  const roomNumber = String(raw.roomNumber || "Consultation Room 2").trim();

  if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
    return apiError("Invalid appointment ID.", 400);
  }

  // Verify the appointment belongs to this doctor
  const [appt] = await db
    .select({
      id: appointments.id,
      patientId: appointments.patientId,
      date: appointments.date,
      time: appointments.time,
      status: appointments.status,
      patientName: users.name,
    })
    .from(appointments)
    .innerJoin(users, eq(users.id, appointments.patientId))
    .where(and(eq(appointments.id, appointmentId), eq(appointments.doctorId, doctor.id)))
    .limit(1);

  if (!appt) {
    return apiError("Appointment not found or not assigned to you.", 404);
  }

  // Update status to checked_in
  await db
    .update(appointments)
    .set({
      status: "checked_in",
      updatedAt: new Date(),
    })
    .where(eq(appointments.id, appointmentId));

  // Notify the patient that their turn has arrived
  if (appt.patientId) {
    void notifyUser({
      userId: appt.patientId,
      title: "📢 It's Your Turn!",
      message: `Dr. ${doctor.name} is ready for your consultation. Please proceed to ${roomNumber}.`,
      type: "appointment",
      link: "/(patient)",
    });
  }

  // Also find the NEXT waiting appointment in queue and alert them that they are next
  const [nextAppt] = await db
    .select({
      id: appointments.id,
      patientId: appointments.patientId,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.doctorId, doctor.id),
        eq(appointments.date, appt.date),
        eq(appointments.caseType, "clinical_visit"),
        ne(appointments.status, "cancelled"),
        ne(appointments.status, "completed"),
        ne(appointments.id, appointmentId)
      )
    )
    .orderBy(asc(appointments.time), asc(appointments.id))
    .limit(1);

  if (nextAppt?.patientId) {
    void notifyUser({
      userId: nextAppt.patientId,
      title: "⏳ Next in Line for Consultation",
      message: `Your turn with Dr. ${doctor.name} is approaching! Please be seated near ${roomNumber}.`,
      type: "appointment",
      link: "/(patient)",
    });
  }

  return apiOk({
    appointmentId,
    status: "checked_in",
    message: `Called ${appt.patientName} for consultation in ${roomNumber}.`,
  });
}
