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

  // Doctors/office staff may download their own consultations; patients only their own.
  let doctorId: number;
  if (["doctor", "receptionist", "admin"].includes(user.role)) {
    doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
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

  try {
    // Dynamic import keeps the heavy renderer out of the main server bundle.
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const element = React.createElement(PrescriptionPdf, { data }) as unknown as React.ReactElement<
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
