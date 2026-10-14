import { NextRequest } from "next/server";
import React from "react";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { consultations } from "@/lib/db/schema";
import { requireApiDoctorOnly, requireApiRole } from "@/lib/auth/guard";
import { getConsultationForPdf } from "@/lib/queries/doctor";
import { PrescriptionPdf } from "@/components/pdf/prescription-pdf";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ consultationId: string }> }
) {
  // Doctor-only panel (audit F-02): the layout blocks /doctor/consultations
  // for receptionists and every non-doctor tier, so the data endpoint must
  // too. Patients keep read access to their OWN prescription below.
  let doctorId: number;
  let patientId: number | null = null;
  const doctor = await requireApiDoctorOnly();
  if (doctor instanceof Response) {
    const patient = await requireApiRole(["patient"]);
    if (patient instanceof Response) return patient;
    patientId = patient.id;
    doctorId = 0; // resolved from the patient's own consultation below
  } else {
    doctorId = doctor.id;
  }

  const { consultationId } = await params;
  const id = Number(consultationId);
  if (!Number.isInteger(id)) return new Response("Bad request", { status: 400 });

  // Doctors may download their own consultations; patients only their own.
  if (patientId !== null) {
    const [c] = await db
      .select({ doctorId: consultations.doctorId })
      .from(consultations)
      .where(and(eq(consultations.id, id), eq(consultations.patientId, patientId)));
    if (!c?.doctorId) return new Response("Not found", { status: 404 });
    doctorId = c.doctorId;
  }

  const data = await getConsultationForPdf(doctorId, id);
  if (!data) return new Response("Not found", { status: 404 });

  // Verification QR (no-key goqr.me, server-side). Omitted when upstream is down.
  let qrDataUrl: string | null = null;
  try {
    const { qrPngBytes } = await import("@/lib/integrations/public-apis");
    const { APP_URL } = await import("@/lib/config");
    const qrText = `${APP_URL}/api/prescriptions/${id} | Rx ${id} | ${data.patient?.name ?? "patient"}`;
    const { data: bytes } = await qrPngBytes(qrText, 180);
    qrDataUrl = `data:image/png;base64,${Buffer.from(bytes).toString("base64")}`;
  } catch {
    qrDataUrl = null;
  }

  try {
    // Dynamic import keeps the heavy renderer out of the main server bundle.
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const element = React.createElement(PrescriptionPdf, { data: { ...data, qrDataUrl } }) as unknown as React.ReactElement<
      import("@react-pdf/renderer").DocumentProps
    >;
    const buffer = await renderToBuffer(element);

    const patientName = data.patient?.name?.replace(/[^\w\s-]/g, "").trim() || "patient";
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="prescription-${patientName}-${id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Prescription PDF generation failed:", err);
    return new Response("PDF generation failed", { status: 500 });
  }
}
