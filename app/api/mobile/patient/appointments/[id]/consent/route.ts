import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments, appointmentConsultConsents, users } from "@/lib/db/schema";
import { apiError, apiOk, requirePatientActor } from "@/app/api/mobile/_helpers";
import { notifyUser } from "@/lib/notifications/service";

export const runtime = "nodejs";

const STANDARD_CONSENT_TEXT = [
  "1. Informed Consent: I consent to receive professional medical consultation, diagnostic assessment, and clinical advice from the attending healthcare specialist.",
  "2. Telemedicine & Procedure Scope: I acknowledge that remote video or voice consultation involves assessment through digital communication channels. If my clinical symptoms indicate an acute medical emergency, I will promptly seek in-person emergency hospital care.",
  "3. Medical History & Disclosure: I confirm that the medical history, symptoms, prior allergies, and ongoing medications I report are accurate and truthful to the best of my knowledge.",
  "4. Privacy & Data Confidentiality: My personal health information and consultation records will remain strictly confidential and secured in accordance with applicable healthcare data privacy guidelines.",
].join("\n\n");

/**
 * GET /api/mobile/patient/appointments/[id]/consent
 * Returns the informed consent terms and current signing status for the appointment.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const patient = await requirePatientActor();
  if (patient instanceof Response) return patient;

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
      doctorName: users.name,
      doctorQualification: users.qualification,
    })
    .from(appointments)
    .innerJoin(users, eq(users.id, appointments.doctorId))
    .where(
      and(
        eq(appointments.id, appointmentId),
        eq(appointments.patientId, patient.id)
      )
    );

  if (!appt) {
    return apiError("Appointment not found.", 404);
  }

  const [existingConsent] = await db
    .select()
    .from(appointmentConsultConsents)
    .where(eq(appointmentConsultConsents.appointmentId, appointmentId))
    .limit(1);

  const isAccepted = Boolean(
    existingConsent?.isAccepted || appt.consentValue === "signed_in_app"
  );

  return apiOk({
    appointmentId,
    doctorId: appt.doctorId,
    doctorName: appt.doctorName,
    doctorQualification: appt.doctorQualification,
    patientName: patient.name,
    date: appt.date,
    time: appt.time,
    caseType: appt.caseType,
    isAccepted,
    acceptedAt: existingConsent?.acceptedAt
      ? existingConsent.acceptedAt.toISOString()
      : isAccepted
      ? new Date().toISOString()
      : null,
    status: isAccepted ? "confirmed" : "pending",
    consentText: STANDARD_CONSENT_TEXT,
  });
}

/**
 * POST /api/mobile/patient/appointments/[id]/consent
 * Signs and confirms patient informed consent for the consultation.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const patient = await requirePatientActor();
  if (patient instanceof Response) return patient;

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
      status: appointments.status,
      doctorName: users.name,
    })
    .from(appointments)
    .innerJoin(users, eq(users.id, appointments.doctorId))
    .where(
      and(
        eq(appointments.id, appointmentId),
        eq(appointments.patientId, patient.id)
      )
    );

  if (!appt) {
    return apiError("Appointment not found.", 404);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body.", 400);
  }

  const raw = (body ?? {}) as Record<string, unknown>;
  const agreementChecked = Boolean(raw.agreementChecked);
  if (!agreementChecked) {
    return apiError("You must agree to the informed consent terms.", 400);
  }

  const signatureDataUrl = typeof raw.signatureDataUrl === "string" ? raw.signatureDataUrl : undefined;
  const now = new Date();

  // Find existing row in appointmentConsultConsents
  const [existingConsent] = await db
    .select({ id: appointmentConsultConsents.id })
    .from(appointmentConsultConsents)
    .where(eq(appointmentConsultConsents.appointmentId, appointmentId))
    .limit(1);

  if (existingConsent) {
    await db
      .update(appointmentConsultConsents)
      .set({
        isAccepted: true,
        isRejected: false,
        acceptedAt: now,
        status: "confirmed",
        consentFile: signatureDataUrl?.slice(0, 255) ?? null,
        updatedAt: now,
      })
      .where(eq(appointmentConsultConsents.id, existingConsent.id));
  } else {
    await db.insert(appointmentConsultConsents).values({
      appointmentId,
      doctorId: appt.doctorId,
      patientId: patient.id,
      slug: `consent-${appointmentId}-${Date.now()}`,
      isAccepted: true,
      isRejected: false,
      acceptedAt: now,
      status: "confirmed",
      consentFile: signatureDataUrl?.slice(0, 255) ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Update appointment status and consent attributes
  await db
    .update(appointments)
    .set({
      consentType: "consent",
      consentValue: "signed_in_app",
      status: appt.status === "pending_consent" ? "confirmed" : appt.status,
      updatedAt: now,
    })
    .where(eq(appointments.id, appointmentId));

  // Notify Doctor
  void notifyUser({
    userId: appt.doctorId,
    title: "Informed Consent Signed 🛡️",
    message: `${patient.name} has signed the consultation informed consent for ${appt.date} at ${appt.time}.`,
    type: "appointment",
    link: "/schedule",
  });

  // Notify Patient
  void notifyUser({
    userId: patient.id,
    title: "Consent Form Confirmed ✓",
    message: `Your informed consent for Dr. ${appt.doctorName} (${appt.date}) has been verified.`,
    type: "appointment",
    link: "/(patient)",
  });

  return apiOk({
    success: true,
    isAccepted: true,
    acceptedAt: now.toISOString(),
    status: "confirmed",
  });
}
