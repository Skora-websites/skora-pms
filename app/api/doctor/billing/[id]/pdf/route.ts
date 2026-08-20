import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { getBillById } from "@/lib/queries/doctor";
import { audit } from "@/lib/security/audit-log";
import React from "react";

export const runtime = "nodejs";

/**
 * GET /api/doctor/billing/[id]/pdf
 * Generates a printable PDF bill (react-pdf invoice) scoped by doctorId.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireRole(["doctor", "receptionist", "admin"]);

  const { id } = await params;
  const billId = Number(id);
  if (!Number.isInteger(billId) || billId <= 0) {
    return NextResponse.json({ error: "Invalid bill id" }, { status: 400 });
  }

  const doctorId =
    user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;

  const bill = await getBillById(doctorId, billId);
  if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });

  // Fire-and-forget audit (non-blocking)
  void audit.pdfDownloaded(user.id, {
    entity: "billing",
    entityId: bill.id,
    description: `Bill PDF downloaded: ${bill.billNumber}`,
  });

  try {
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { BillPdf } = await import("@/components/pdf/bill-pdf");
    const element = React.createElement(BillPdf, {
      data: {
        billNumber: bill.billNumber,
        billDate: bill.billDate,
        patientName: bill.patientName ?? "—",
        patientId: bill.patientRegistrationId ?? String(bill.patientId),
        patientPhone: bill.patientPhone,
        patientEmail: bill.patientEmail,
        doctorName: bill.doctorName,
        doctorQualification: bill.doctorQualification,
        billingTypeName: bill.billingTypeName ?? "Service",
        totalAmount: bill.totalAmount,
        receivedAmount: bill.receivedAmount ?? "0",
        pendingAmount: bill.pendingAmount ?? "0",
        paymentMethod: bill.paymentMethod,
        status: bill.status ?? "pending",
        notes: bill.notes,
        printDate: new Date().toISOString().slice(0, 10),
      },
    }) as unknown as React.ReactElement<import("@react-pdf/renderer").DocumentProps>;
    const pdfBuffer = await renderToBuffer(element);

    const safeName = bill.billNumber.replace(/[^a-zA-Z0-9-_]/g, "_");
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="bill-${safeName}.pdf"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (err) {
    console.error("Bill PDF generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
