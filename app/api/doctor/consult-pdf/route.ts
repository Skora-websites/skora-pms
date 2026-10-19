import fs from "node:fs/promises";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { doctorConsultPdfs } from "@/lib/db/schema";
import { requireApiPermission } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { resolveWithinStorage } from "@/lib/utils/uploads";
import { audit } from "@/lib/security/audit-log";

export const runtime = "nodejs";

/**
 * Serve the doctor's consultation-terms PDF.
 *
 * Dashboard-scoped (`dashboard` module, audit F-01). The guard previously
 * admitted receptionists AND resolved them to the practice OWNER's row, so a
 * front-desk account could read and overwrite the owner's clinical terms
 * (audit H11). Now: doctors read their own; the owner/manager tier reads any
 * doctor in its business; receptionists are refused.
 */
export async function GET() {
  const user = await requireApiPermission(["doctor", "admin", "manager"], "dashboard");
  if (user instanceof Response) return user;

  const doctorIds =
    user.role === "doctor" ? [user.id] : (await getBusinessScope()).doctorIds;
  if (doctorIds.length === 0) return new Response("Not found", { status: 404 });

  // `doctor_consult_pdfs.doctor_id` is unique, so one scoped lookup suffices.
  const [row] = await db
    .select({ pdfPath: doctorConsultPdfs.pdfPath })
    .from(doctorConsultPdfs)
    .where(inArray(doctorConsultPdfs.doctorId, doctorIds));
  if (!row?.pdfPath) return new Response("Not found", { status: 404 });

  void audit.pdfDownloaded(user.id, { doctorId: doctorIds[0] });

  // Path comes from the DB, but guard anyway (parity with every other serving route).
  const filePath = resolveWithinStorage(row.pdfPath);
  if (!filePath) return new Response("Forbidden", { status: 403 });

  try {
    const bytes = await fs.readFile(filePath);
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="consultation-terms.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
