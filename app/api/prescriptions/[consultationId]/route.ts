import { NextRequest } from "next/server";
import React from "react";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  consultations,
  consultationMedications,
  doctorClinics,
  users,
} from "@/lib/db/schema";
import { requireApiDoctorOnly, requireApiRole } from "@/lib/auth/guard";
import { audit } from "@/lib/security/audit-log";
import { logger as log } from "@/lib/security/logger";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ consultationId: string }> }
) {
  let doctorId: number | null = null;
  let patientId: number | null = null;
  let actorId = 0;

  const doctor = await requireApiDoctorOnly();
  if (doctor instanceof Response) {
    const patient = await requireApiRole(["patient"]);
    if (patient instanceof Response) return patient;
    patientId = patient.id;
    actorId = patient.id;
  } else {
    doctorId = doctor.id;
    actorId = doctor.id;
  }

  const { consultationId } = await params;
  const id = Number(consultationId);
  if (!Number.isInteger(id) || id <= 0) {
    return new Response("Not found", { status: 404 });
  }

  const [consultation] = await db
    .select()
    .from(consultations)
    .where(and(eq(consultations.id, id), isNull(consultations.deletedAt)))
    .limit(1);

  if (!consultation) {
    return new Response("Not found", { status: 404 });
  }

  if (doctorId !== null && consultation.doctorId !== doctorId) {
    return new Response("Not found", { status: 404 });
  }
  if (patientId !== null && consultation.patientId !== patientId) {
    return new Response("Not found", { status: 404 });
  }

  const [patient] = consultation.patientId
    ? await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          gender: users.gender,
          dob: users.dob,
          city: users.city,
        })
        .from(users)
        .where(eq(users.id, consultation.patientId))
        .limit(1)
    : [null];

  const [doctorUser] = await db
    .select({
      id: users.id,
      name: users.name,
      qualification: users.qualification,
      registrationNumber: users.registrationNumber,
      signaturePath: users.signaturePath,
    })
    .from(users)
    .where(eq(users.id, consultation.doctorId))
    .limit(1);

  const [clinic] = await db
    .select({
      clinicName: doctorClinics.clinicName,
      address: doctorClinics.address,
      phone: doctorClinics.phone,
    })
    .from(doctorClinics)
    .where(eq(doctorClinics.doctorId, consultation.doctorId))
    .limit(1);

  const medications = await db
    .select({
      id: consultationMedications.id,
      medicineName: consultationMedications.medicineName,
      dose: consultationMedications.dose,
      frequency: consultationMedications.frequency,
      duration: consultationMedications.duration,
      refills: consultationMedications.refills,
      note: consultationMedications.note,
    })
    .from(consultationMedications)
    .where(eq(consultationMedications.consultationId, consultation.id))
    .orderBy(asc(consultationMedications.order));

  let qrDataUrl: string | null = null;
  try {
    const { qrPngBytes } = await import("@/lib/integrations/public-apis");
    const { APP_URL } = await import("@/lib/config");
    const qrText = `${APP_URL}/api/prescriptions/${id} | Rx ${id} | ${patient?.name ?? "patient"}`;
    const { data: bytes } = await qrPngBytes(qrText, 180);
    qrDataUrl = `data:image/png;base64,${Buffer.from(bytes).toString("base64")}`;
  } catch {
    /* QR is cosmetic — the PDF is still valid without it */
  }

  void audit.prescriptionViewed(actorId, {
    consultationId: id,
    patientId: consultation.patientId ?? null,
  });

  try {
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { PrescriptionPdf } = await import("@/components/pdf/prescription-pdf");

    const pdfData = {
      consultation: {
        id: consultation.id,
        consultationDate: consultation.consultationDate,
        symptomsNote: consultation.symptomsNote,
        examinationNote: consultation.examinationNote,
        diagnosisNote: consultation.diagnosisNote,
        labNote: consultation.labNote,
        medicationsNote: consultation.medicationsNote,
        medicalHistory: consultation.medicalHistory,
        followUpDate: consultation.followUpDate,
        prescriptionStatus: consultation.prescriptionStatus,
        signedAt: consultation.signedAt,
        issuedAt: consultation.issuedAt,
      },
      patient: patient
        ? {
            name: patient.name,
            dob: patient.dob ? String(patient.dob) : null,
            gender: patient.gender,
            phone: patient.phone,
            city: patient.city ?? null,
          }
        : null,
      doctor: doctorUser
        ? {
            name: doctorUser.name,
            qualification: doctorUser.qualification,
            registrationNumber: doctorUser.registrationNumber,
            signatureUrl: doctorUser.signaturePath ?? null,
            doctorSignature: null as string | null,
          }
        : null,
      clinic: clinic ?? null,
      medications,
      qrDataUrl,
    };

    const element = React.createElement(PrescriptionPdf, { data: pdfData } as any);
    const buffer = await renderToBuffer(element as any);

    const patientName = patient?.name?.replace(/[^\w\s-]/g, "").trim() || "patient";
    return new Response(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="prescription-${patientName}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    log.error("prescriptions", "Prescription PDF generation failed.", {
      consultationId: id,
      err,
    });
    return new Response("PDF generation failed", { status: 500 });
  }
}