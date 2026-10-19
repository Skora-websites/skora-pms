import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointmentConsultConsents, users, appointments } from "@/lib/db/schema";
import { CONSENT_TTL_MS } from "@/lib/files/consent-upload";

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
      createdAt: appointmentConsultConsents.createdAt,
      doctorId: appointmentConsultConsents.doctorId,
      patientId: appointmentConsultConsents.patientId,
      appointmentId: appointmentConsultConsents.appointmentId,
    })
    .from(appointmentConsultConsents)
    .where(eq(appointmentConsultConsents.slug, slug));

  if (!consent) return null;

  // A decided consent is no longer servable: the slug holder has already
  // responded, so neither the names nor the appointment details may be
  // exposed again. Mirrors the read policy in the consent-file route.
  if (consent.isAccepted || consent.isRejected) return null;

  // Retention window: a link (and its names/details) dies on the same schedule
  // the answer window and the file download use. The three paths share
  // CONSENT_TTL_MS so they cannot drift (audit M5 / FR-019) — an out-of-window
  // slug is indistinguishable from a non-existent one.
  if (
    consent.createdAt &&
    Date.now() - new Date(consent.createdAt).getTime() > CONSENT_TTL_MS
  ) {
    return null;
  }

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
