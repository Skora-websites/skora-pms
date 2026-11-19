import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments, consultations, consultationMedications } from "@/lib/db/schema";
import {
  getAppointmentById,
  getBillingTypes,
  getConsultationIdByAppointment,
} from "@/lib/queries/doctor";
import { apiError, apiOk, anchorDoctorId, requireDoctorActor } from "@/app/api/mobile/_helpers";
import { notifyUser } from "@/lib/notifications/service";

export const runtime = "nodejs";

/**
 * GET /api/mobile/doctor/consultations/[appointmentId] — the data the
 * consultation form needs for one appointment.
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

/**
 * POST /api/mobile/doctor/consultations/[appointmentId] — complete consultation,
 * issue digital prescription with structured medications, and update appointment.
 */
export async function POST(
  req: Request,
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
  const appt = await getAppointmentById(doctorId, appointmentId);
  if (!appt) return apiError("Appointment not found", 404);

  if (appt.status === "cancelled") {
    return apiError("Cancelled appointments cannot be consulted", 400);
  }
  if (appt.status === "pending_consent") {
    return apiError("Patient consent is required before starting this consultation", 400);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid request body", 400);
  }

  const {
    diagnosisNote,
    symptomsNote,
    examinationNote,
    labNote,
    medicationsNote,
    medicalHistory,
    followUpDate,
    bloodGroup,
    bp,
    weight,
    height,
    medications = [],
  } = body ?? {};

  if (!diagnosisNote || typeof diagnosisNote !== "string" || !diagnosisNote.trim()) {
    return apiError("Diagnosis is required to issue a prescription", 400);
  }

  const now = new Date();
  const patientId = appt.patientId ?? 0;

  const consultationId = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: consultations.id })
      .from(consultations)
      .where(
        and(
          eq(consultations.appointmentId, appointmentId),
          eq(consultations.doctorId, doctorId)
        )
      );

    let consultId: number;
    if (existing) {
      consultId = existing.id;
      await tx
        .update(consultations)
        .set({
          symptomsNote: symptomsNote?.trim() || null,
          examinationNote: examinationNote?.trim() || null,
          diagnosisNote: diagnosisNote.trim(),
          labNote: labNote?.trim() || null,
          medicationsNote: medicationsNote?.trim() || null,
          medicalHistory: medicalHistory?.trim() || null,
          followUpDate: followUpDate?.trim() || null,
          followUpStatus: followUpDate?.trim() ? "pending" : "pending",
          prescriptionStatus: "issued",
          signedAt: now,
          signedByDoctorId: doctorId,
          issuedAt: now,
          updatedAt: now,
        })
        .where(eq(consultations.id, existing.id));
    } else {
      const [insertResult] = await tx.insert(consultations).values({
        patientId,
        doctorId,
        appointmentId,
        consultationDate: now,
        symptomsNote: symptomsNote?.trim() || null,
        examinationNote: examinationNote?.trim() || null,
        diagnosisNote: diagnosisNote.trim(),
        labNote: labNote?.trim() || null,
        medicationsNote: medicationsNote?.trim() || null,
        medicalHistory: medicalHistory?.trim() || null,
        followUpDate: followUpDate?.trim() || null,
        followUpStatus: "pending",
        prescriptionStatus: "issued",
        signedAt: now,
        signedByDoctorId: doctorId,
        issuedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      consultId = Number(insertResult.insertId);
    }

    // Replace structured medications
    if (Array.isArray(medications)) {
      await tx
        .delete(consultationMedications)
        .where(eq(consultationMedications.consultationId, consultId));

      const newMeds: any[] = [];
      for (let i = 0; i < medications.length; i++) {
        const med = medications[i];
        if (med?.medicineName && String(med.medicineName).trim()) {
          newMeds.push({
            consultationId: consultId,
            medicineName: String(med.medicineName).trim(),
            dose: med.dose ? String(med.dose).trim() : null,
            frequency: med.frequency ? String(med.frequency).trim() : null,
            duration: med.duration ? String(med.duration).trim() : null,
            refills: Number(med.refills ?? 0) || 0,
            note: med.instructions || med.note ? String(med.instructions ?? med.note).trim() : null,
            order: i,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
      if (newMeds.length > 0) {
        await tx.insert(consultationMedications).values(newMeds);
      }
    }

    // Persist vitals and mark appointment completed
    await tx
      .update(appointments)
      .set({
        bloodGroup: bloodGroup ? String(bloodGroup).trim() : appt.bloodGroup,
        bp: bp ? String(bp).trim() : appt.bp,
        weight: weight ? String(weight).trim() : appt.weight,
        height: height ? String(height).trim() : appt.height,
        status: "completed",
        updatedAt: now,
      })
      .where(eq(appointments.id, appointmentId));

    return consultId;
  });

  if (appt.patientId) {
    void notifyUser({
      userId: appt.patientId,
      title: "Prescription Issued 💊",
      message: `Dr. ${user.name} has issued your digital prescription for ${diagnosisNote}. Tap to view.`,
      type: "prescription",
      link: "/records",
    });
  }

  return apiOk({
    consultationId,
    appointmentId,
    status: "completed",
    pdfUrl: `/api/prescriptions/${consultationId}`,
  });
}
