import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/guard";
import { getBillById } from "@/lib/queries/doctor";
import { audit } from "@/lib/security/audit-log";
import { getBusinessScope } from "@/lib/auth/scope";
import { db } from "@/lib/db";
import { billings } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import React from "react";

export const runtime = "nodejs";

/**
 * GET /api/doctor/billing/[id]/pdf
 * Generates a printable PDF bill (react-pdf invoice) scoped by doctorId.
 * Admin-tier callers may print any in-scope bill (resolved via getBillById
 * against the bill's owning doctor).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // API routes answer 401/403 outright — never redirect (307 hides the denial).
  // Module permission matches the /doctor/billing page (`billing`); the owner
  // bypasses it by design (requireApiPermission parity with requireAdminTier).
  const user = await requireApiPermission(["doctor", "receptionist", "admin", "manager"], "billing");
  if (user instanceof Response) return user;

  const { id } = await params;
  const billId = Number(id);
  if (!Number.isInteger(billId) || billId <= 0) {
    return NextResponse.json({ error: "Invalid bill id" }, { status: 400 });
  }

  let doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
  if (user.role === "admin" || user.role === "manager") {
    // Verify the bill belongs to the caller's business, then render under the
    // bill's owning doctor (clinic letterhead must match the issuing doctor).
    const scope = await getBusinessScope();
    const [owned] = await db
      .select({ doctorId: billings.doctorId })
      .from(billings)
      .where(and(eq(billings.id, billId), inArray(billings.doctorId, scope.doctorIds.length ? scope.doctorIds : [-1])));
    if (!owned) return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    doctorId = owned.doctorId;
  }

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
    // Verification QR (no-key, server-side). Omitted when upstream is down.
    let qrDataUrl: string | null = null;
    try {
      const { qrPngBytes } = await import("@/lib/integrations/public-apis");
      const qrText = `SkoraCares ${bill.billNumber} | ${bill.patientName ?? "patient"} | Rs.${bill.totalAmount}`;
      const { data: bytes } = await qrPngBytes(qrText, 180);
      qrDataUrl = `data:image/png;base64,${Buffer.from(bytes).toString("base64")}`;
    } catch {
      qrDataUrl = null;
    }
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
        qrDataUrl,
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
