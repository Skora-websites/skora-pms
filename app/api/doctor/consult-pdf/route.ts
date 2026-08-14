import fs from "node:fs/promises";
import path from "node:path";
import { getCurrentUser } from "@/lib/auth/user";
import { getDoctorConsultPdf } from "@/lib/queries/doctor";
import { audit } from "@/lib/security/audit-log";

export const runtime = "nodejs";

const STORAGE_DIR = path.join(process.cwd(), "storage", "uploads");

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!["doctor", "receptionist", "admin"].includes(user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
  const consultPdf = await getDoctorConsultPdf(doctorId);
  if (!consultPdf?.pdfPath) {
    return new Response("Not found", { status: 404 });
  }

  void audit.pdfDownloaded(user.id, { doctorId });

  const filePath = path.join(STORAGE_DIR, consultPdf.pdfPath);
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