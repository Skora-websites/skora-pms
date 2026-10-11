import fs from "node:fs/promises";
import path from "node:path";
import { requireApiPermission } from "@/lib/auth/guard";
import { resolveWithinStorage } from "@/lib/utils/uploads";
import { getDoctorConsultPdf } from "@/lib/queries/doctor";
import { audit } from "@/lib/security/audit-log";

export const runtime = "nodejs";

export async function GET() {
  // Dashboard-scoped: the consultation-terms PDF sits behind the `dashboard`
  // module like the consultation pages themselves (audit F-01).
  const user = await requireApiPermission(["doctor", "receptionist"], "dashboard");
  if (user instanceof Response) return user;

  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
  const consultPdf = await getDoctorConsultPdf(doctorId);
  if (!consultPdf?.pdfPath) {
    return new Response("Not found", { status: 404 });
  }

  void audit.pdfDownloaded(user.id, { doctorId });

  // Path comes from the doctor's own DB row, but guard anyway (parity with
  // every other serving route).
  const filePath = resolveWithinStorage(consultPdf.pdfPath);
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