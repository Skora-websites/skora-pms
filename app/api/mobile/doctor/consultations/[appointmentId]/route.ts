import {
  getAppointmentById,
  getBillingTypes,
  getConsultationIdByAppointment,
} from "@/lib/queries/doctor";
import { apiError, apiOk, anchorDoctorId, requireDoctorActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/doctor/consultations/[appointmentId] — the data the
 * consultation form needs for one appointment.
 *
 * Doctor-only area (`/doctor/consultations` ∈ DOCTOR_ONLY_PATHS); guarded
 * with the existing `requireApiDoctorOnly` so a receptionist is refused
 * server-side rather than merely hidden in the app.
 *
 * Wraps the three helpers `app/doctor/consultations/[appointmentId]/page.tsx`
 * calls on that appointment, each anchored on the session's doctor id:
 * `getAppointmentById` (doctor.ts:189), `getConsultationIdByAppointment`
 * (doctor.ts:1023) and `getBillingTypes` (doctor.ts:368). The prescription
 * PDF is served by the existing byte route
 * `GET /api/prescriptions/[consultationId]`.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const user = await requireDoctorActor();
  if (user instanceof Response) return user;

  const { appointmentId: raw } = await params;
  const appointmentId = Number(raw);
  if (!Number.isInteger(appointmentId)) {
    return apiError("Invalid appointment", 400);
  }

  const doctorId = anchorDoctorId(user);
  const appointment = await getAppointmentById(doctorId, appointmentId);
  if (!appointment) return apiError("Appointment not found", 404);

  const [consultationId, billingTypes] = await Promise.all([
    getConsultationIdByAppointment(doctorId, appointment.id),
    getBillingTypes(doctorId),
  ]);

  return apiOk({ appointment, consultationId, billingTypes });
}
