import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointmentConsultConsents, users, appointments } from "@/lib/db/schema";

export type ConsentDetails = {
  slug: string;
  status: string | null;
  isAccepted: boolean | null;
  isRejected: boolean | null;
  consentFile: string | null;
  doctorName: string;
  doctorQualification: string | null;
  patientName: string;
  appointmentDate: string | null;
  appointmentTime: string | null;
  appointmentNote: string | null;
};

export const getConsentBySlug = cache(async (slug: string): Promise<ConsentDetails | null> => {
  const [consent] = await db
    .select({
      slug: appointmentConsultConsents.slug,
      status: appointmentConsultConsents.status,
      isAccepted: appointmentConsultConsents.isAccepted,
      isRejected: appointmentConsultConsents.isRejected,
      consentFile: appointmentConsultConsents.consentFile,
      doctorId: appointmentConsultConsents.doctorId,
      patientId: appointmentConsultConsents.patientId,
      appointmentId: appointmentConsultConsents.appointmentId,
    })
    .from(appointmentConsultConsents)
    .where(eq(appointmentConsultConsents.slug, slug));

  if (!consent) return null;

  const [doctor] = await db
    .select({ name: users.name, qualification: users.qualification })
    .from(users)
    .where(eq(users.id, consent.doctorId));

  const [patient] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, consent.patientId));

  const [appointment] = consent.appointmentId
    ? await db
        .select({ date: appointments.date, time: appointments.time, note: appointments.note })
        .from(appointments)
        .where(eq(appointments.id, consent.appointmentId))
    : [null];

  return {
    slug: consent.slug,
    status: consent.status,
    isAccepted: consent.isAccepted,
    isRejected: consent.isRejected,
    consentFile: consent.consentFile,
    doctorName: doctor?.name ?? "Doctor",
    doctorQualification: doctor?.qualification ?? null,
    patientName: patient?.name ?? "Patient",
    appointmentDate: appointment?.date ?? null,
    appointmentTime: appointment?.time ?? null,
    appointmentNote: appointment?.note ?? null,
  };
});
