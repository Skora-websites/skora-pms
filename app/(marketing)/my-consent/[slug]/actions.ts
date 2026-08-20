"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import React from "react";
import { db } from "@/lib/db";
import { appointmentConsultConsents, appointments, users } from "@/lib/db/schema";
import { authRateLimit } from "@/lib/security/rate-limit";
import { audit } from "@/lib/security/audit-log";
import { getClientIp } from "@/lib/security/ip";
import { consentSchema } from "@/lib/validation";

export type ConsentState = { error: string | null };

// Consent links expire 7 days after creation (legacy vendor-link parity).
const CONSENT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Uploaded consent files + auto-generated consent PDFs live outside public/ (PHI-safe).
const CONSENT_FILES_DIR = path.join(process.cwd(), "storage", "uploads", "consent-files");
const CONSENT_PDFS_DIR = path.join(process.cwd(), "storage", "uploads", "consent-pdfs");

/** Magic-byte check — only real JPG/PNG/PDF files pass (spoofed extensions rejected). */
function sniffConsentFile(bytes: Buffer): "jpg" | "png" | "pdf" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return "png";
  if (bytes.length >= 5 && bytes.subarray(0, 5).toString("latin1") === "%PDF-") return "pdf";
  return null;
}

/** Save a patient-uploaded consent document (jpg/png/pdf, max 5 MB). */
async function saveUploadedFile(file: File): Promise<string | null> {
  if (file.size === 0) return null;
  if (file.size > 5 * 1024 * 1024) throw new Error("File must be under 5 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = sniffConsentFile(bytes);
  if (!kind) throw new Error("Only JPG, PNG or PDF files are allowed.");
  const filename = `${crypto.randomUUID()}.${kind}`;
  await fs.mkdir(CONSENT_FILES_DIR, { recursive: true });
  await fs.writeFile(path.join(CONSENT_FILES_DIR, filename), bytes);
  return `consent-files/${filename}`;
}

type ConsentPdfInput = {
  appointmentId: number | null;
  date: string | null;
  time: string | null;
  caseType: string;
  patientName: string;
  registrationId: string | null;
  doctorName: string;
  acceptedAt: Date;
};

/** Auto-generate the consent certificate PDF (DomPDF parity via react-pdf). */
async function generateConsentPdf(input: ConsentPdfInput): Promise<string | null> {
  try {
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { ConsultConsentPdf } = await import("@/components/pdf/consult-consent-pdf");

    const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "SkoraCares";
    const element = React.createElement(ConsultConsentPdf, {
      data: {
        appointmentId: input.appointmentId ?? 0,
        date: input.date ?? "—",
        time: input.time ?? "—",
        caseType: input.caseType,
        patientName: input.patientName,
        patientId: input.registrationId ?? "N/A",
        doctorName: input.doctorName,
        acceptedAt: input.acceptedAt.toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        appName,
        slug: "",
      },
    }) as unknown as React.ReactElement<import("@react-pdf/renderer").DocumentProps>;

    const buffer = await renderToBuffer(element);

    const filename = `consent_${input.appointmentId ?? "appt"}_${Date.now()}.pdf`;
    await fs.mkdir(CONSENT_PDFS_DIR, { recursive: true });
    await fs.writeFile(path.join(CONSENT_PDFS_DIR, filename), buffer);
    return `consent-pdfs/${filename}`;
  } catch (err) {
    console.error("Consent PDF generation failed:", err);
    return null;
  }
}

export async function respondConsent(
  _prev: ConsentState,
  formData: FormData
): Promise<ConsentState> {
  const slug = String(formData.get("slug") ?? "");
  const decision = String(formData.get("decision") ?? "");

  const parsed = consentSchema.safeParse({ slug, decision });
  if (!parsed.success) {
    return { error: "Invalid request." };
  }

  const { allowed, retryAfterMs } = authRateLimit.consent(slug);
  if (!allowed) {
    const minutes = Math.ceil(retryAfterMs / 60_000);
    return { error: `Too many attempts. Try again in ${minutes} minute(s).` };
  }

  const [row] = await db
    .select({
      id: appointmentConsultConsents.id,
      doctorId: appointmentConsultConsents.doctorId,
      patientId: appointmentConsultConsents.patientId,
      appointmentId: appointmentConsultConsents.appointmentId,
      isAccepted: appointmentConsultConsents.isAccepted,
      isRejected: appointmentConsultConsents.isRejected,
      createdAt: appointmentConsultConsents.createdAt,
      consentFile: appointmentConsultConsents.consentFile,
    })
    .from(appointmentConsultConsents)
    .where(eq(appointmentConsultConsents.slug, slug));

  if (!row) {
    await audit.consentRevoked({ slug, decision, reason: "not_found" });
    return { error: "Consent record not found." };
  }

  // ── Expiry check: links older than 7 days can no longer be answered. ──
  if (!row.isAccepted && !row.isRejected && row.createdAt) {
    const age = Date.now() - new Date(row.createdAt).getTime();
    if (age > CONSENT_TTL_MS) {
      await audit.consentRevoked({ slug, consentId: row.id, doctorId: row.doctorId, reason: "expired" });
      return { error: "This consent link has expired. Please contact the clinic." };
    }
  }

  // ── Already decided → no double submission. ──
  if (row.isAccepted || row.isRejected) {
    return { error: "Your response has already been recorded." };
  }

  const now = new Date();

  // ── Optional patient upload (jpg/png/pdf, max 5 MB) ──
  let uploadedPath: string | null = null;
  const file = formData.get("consent_file") as File | null;
  if (file && file.size > 0) {
    try {
      uploadedPath = await saveUploadedFile(file);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Invalid file." };
    }
  }

  // ── Auto-generate consent PDF on accept (DomPDF parity) ──
  let pdfPath: string | null = null;
  if (decision === "accept") {
    const [appt] = row.appointmentId
      ? await db
          .select({
            date: appointments.date,
            time: appointments.time,
            caseType: appointments.caseType,
          })
          .from(appointments)
          .where(eq(appointments.id, row.appointmentId))
      : [null];

    const [patient] = await db
      .select({ name: users.name, registrationId: users.registrationId })
      .from(users)
      .where(eq(users.id, row.patientId));

    const [doctor] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, row.doctorId));

    pdfPath = await generateConsentPdf({
      appointmentId: row.appointmentId,
      date: appt?.date ?? null,
      time: appt?.time ?? null,
      caseType: appt?.caseType ?? "clinical_visit",
      patientName: patient?.name ?? "Patient",
      registrationId: patient?.registrationId ?? null,
      doctorName: doctor?.name ?? "Doctor",
      acceptedAt: now,
    });
  }

  // ── Persist consent decision + file ──
  const consentFile = decision === "accept" ? (pdfPath ?? uploadedPath) : uploadedPath;

  await db
    .update(appointmentConsultConsents)
    .set(
      decision === "accept"
        ? {
            isAccepted: true,
            isRejected: false,
            acceptedAt: now,
            rejectedAt: null,
            consentFile,
            status: "confirmed",
            updatedAt: now,
          }
        : {
            isRejected: true,
            isAccepted: false,
            rejectedAt: now,
            acceptedAt: null,
            consentFile,
            status: "cancelled",
            updatedAt: now,
          }
    )
    .where(eq(appointmentConsultConsents.id, row.id));

  // ── Sync appointment status (legacy parity) ──
  if (row.appointmentId) {
    await db
      .update(appointments)
      .set({
        status: decision === "accept" ? "confirmed" : "cancelled",
        updatedAt: now,
      })
      .where(eq(appointments.id, row.appointmentId));
  }

  // ── Audit ──
  const ip = await getClientIp();
  if (decision === "accept") {
    await audit.consentGiven({
      slug,
      consentId: row.id,
      doctorId: row.doctorId,
      appointmentId: row.appointmentId,
      file: consentFile ? "uploaded" : "none",
      ip,
    });
  } else {
    await audit.consentRevoked({
      slug,
      consentId: row.id,
      doctorId: row.doctorId,
      appointmentId: row.appointmentId,
      file: consentFile ? "uploaded" : "none",
      ip,
    });
  }

  revalidatePath(`/my-consent/${slug}`);
  return { error: null };
}
