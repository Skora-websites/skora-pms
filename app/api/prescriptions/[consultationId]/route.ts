import { NextRequest } from "next/server";
import React from "react";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { consultations } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";
import { getConsultationForPdf } from "@/lib/queries/doctor";
import { PrescriptionPdf } from "@/components/pdf/prescription-pdf";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ consultationId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { consultationId } = await params;
  const id = Number(consultationId);
  if (!Number.isInteger(id)) return new Response("Bad request", { status: 400 });

  // Doctors may download their own consultations; patients only their own.
  // Receptionists are excluded outright — doctor-only panel (audit F-02):
  // the layout blocks /doctor/consultations for them regardless of perms.
  let doctorId: number;
  if (user.role === "doctor") {
    doctorId = user.id;
  } else if (user.role === "patient") {
    const [c] = await db
      .select({ doctorId: consultations.doctorId })
      .from(consultations)
      .where(and(eq(consultations.id, id), eq(consultations.patientId, user.id)));
    if (!c?.doctorId) return new Response("Not found", { status: 404 });
    doctorId = c.doctorId;
  } else {
    return new Response("Forbidden", { status: 403 });
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
