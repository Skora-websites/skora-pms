import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments, users, doctorClinics } from "@/lib/db/schema";
import { apiError, apiOk, requirePatientActor } from "@/app/api/mobile/_helpers";
import { todayStr } from "@/lib/utils";

export const runtime = "nodejs";

export interface QueueStatusResponse {
  appointmentId: number;
  tokenNumber: number;
  currentlyServingToken: number;
  patientsAhead: number;
  estimatedWaitMinutes: number;
  status: string;
  doctorName: string;
  clinicName: string;
  roomNumber: string;
  isNextInLine: boolean;
  isYourTurn: boolean;
  appointmentDate: string;
  appointmentTime: string;
}

/**
 * GET /api/mobile/patient/queue/[id]
 * Returns the live OPD token queue status, currently serving token, and estimated wait time for an appointment.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await requirePatientActor();
  if (actor instanceof Response) return actor;

  const { id } = await params;
  const appointmentId = Number(id);
  if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
    return apiError("Invalid appointment ID.", 400);
  }

  // Fetch the patient's appointment
  const [appt] = await db
    .select({
      id: appointments.id,
      patientId: appointments.patientId,
      doctorId: appointments.doctorId,
      date: appointments.date,
      time: appointments.time,
      caseType: appointments.caseType,
      status: appointments.status,
      doctorName: users.name,
    })
    .from(appointments)
    .innerJoin(users, eq(users.id, appointments.doctorId))
    .where(eq(appointments.id, appointmentId))
    .limit(1);

  if (!appt) {
    return apiError("Appointment not found.", 404);
  }

  if (appt.patientId !== actor.id) {
    return apiError("Unauthorized to view this queue token.", 403);
  }

  // Fetch doctor's clinic details
  const [clinic] = await db
    .select({
      clinicName: doctorClinics.clinicName,
      address: doctorClinics.address,
    })
    .from(doctorClinics)
    .where(and(eq(doctorClinics.doctorId, appt.doctorId), eq(doctorClinics.isActive, true)))
    .limit(1);

  // Fetch all in-clinic appointments for this doctor on this day
  const dayAppts = await db
    .select({
      id: appointments.id,
      time: appointments.time,
      status: appointments.status,
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.doctorId, appt.doctorId),
        eq(appointments.date, appt.date),
        eq(appointments.caseType, "clinical_visit"),
        ne(appointments.status, "cancelled")
      )
    )
    .orderBy(asc(appointments.time), asc(appointments.id));

  // Find 1-based token index for the patient's appointment
  const myIndex = dayAppts.findIndex((a) => a.id === appointmentId);
  const tokenNumber = myIndex >= 0 ? myIndex + 1 : 1;

  // Find currently serving token
  // Priority: first appointment marked "checked_in"
  let servingIndex = dayAppts.findIndex((a) => a.status === "checked_in");
  if (servingIndex === -1) {
    // If none checked in, find the first non-completed appointment
    servingIndex = dayAppts.findIndex((a) => a.status !== "completed");
  }
  const currentlyServingToken = servingIndex >= 0 ? servingIndex + 1 : 1;

  const patientsAhead = Math.max(0, tokenNumber - currentlyServingToken);
  const estimatedWaitMinutes = patientsAhead * 15;

  const isYourTurn =
    appt.status === "checked_in" ||
    (patientsAhead === 0 && appt.status !== "completed" && appt.status !== "cancelled");
  const isNextInLine = patientsAhead === 1;

  const clinicName = clinic?.clinicName || "SkoraCare Clinical OPD";
  const roomNumber = "Room 2, OPD Suite";

  const response: QueueStatusResponse = {
    appointmentId,
    tokenNumber,
    currentlyServingToken,
    patientsAhead,
    estimatedWaitMinutes,
    status: appt.status,
    doctorName: appt.doctorName,
    clinicName,
    roomNumber,
    isNextInLine,
    isYourTurn,
    appointmentDate: appt.date,
    appointmentTime: appt.time,
  };

  return apiOk(response);
}
