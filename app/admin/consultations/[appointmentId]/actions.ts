"use server";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments, consultations, users } from "@/lib/db/schema";

export type AdminConsultationRecord = {
  appointmentId: number;
  patientName: string;
  patientPhone: string | null;
  doctorName: string | null;
  consultationDate: string | null;
  symptomsNote: string | null;
  examinationNote: string | null;
  diagnosisNote: string | null;
  labNote: string | null;
  medicationsNote: string | null;
  medicalHistory: string | null;
  followUpDate: string | null;
  followUpStatus: string | null;
};

/**
 * One consultation record, read-only, for the admin/manager tier.
 *
 * `doctorIds` is the caller's business scope: a consultation whose doctor is
 * outside it returns null (404), so an id belonging to another business cannot
 * be enumerated through this route.
 */
export async function getConsultationRecordForAdmin(
  appointmentId: number,
  doctorIds: number[]
): Promise<AdminConsultationRecord | null> {
  if (doctorIds.length === 0 || !Number.isInteger(appointmentId) || appointmentId <= 0) return null;

  const [row] = await db
    .select({
      appointmentId: appointments.id,
      consultationDate: consultations.consultationDate,
      symptomsNote: consultations.symptomsNote,
      examinationNote: consultations.examinationNote,
      diagnosisNote: consultations.diagnosisNote,
      labNote: consultations.labNote,
      medicationsNote: consultations.medicationsNote,
      medicalHistory: consultations.medicalHistory,
      followUpDate: consultations.followUpDate,
      followUpStatus: consultations.followUpStatus,
      patientName: users.name,
      patientPhone: users.phone,
    })
    .from(appointments)
    .innerJoin(consultations, eq(consultations.appointmentId, appointments.id))
    .innerJoin(users, eq(users.id, appointments.patientId))
    .where(and(eq(appointments.id, appointmentId), inArray(appointments.doctorId, doctorIds)));

  if (!row) return null;

  // Treating doctor, resolved separately so the join stays a single table alias.
  const [doctor] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, await doctorIdForAppointment(appointmentId)));

  return { ...row, consultationDate: formatDate(row.consultationDate), doctorName: doctor?.name ?? null };
}

/** ` consultations.consultationDate` is a DATE column rendered as ISO text. */
function formatDate(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

/** The doctor the appointment belongs to (already scoped by the caller). */
async function doctorIdForAppointment(appointmentId: number): Promise<number> {
  const [row] = await db
    .select({ doctorId: appointments.doctorId })
    .from(appointments)
    .where(eq(appointments.id, appointmentId));
  return row?.doctorId ?? 0;
}
