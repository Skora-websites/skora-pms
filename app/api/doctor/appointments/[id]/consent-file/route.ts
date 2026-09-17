import { NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointmentConsultConsents, appointments } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";

export const runtime = "nodejs";

const STORAGE_DIR = path.join(process.cwd(), "storage", "uploads");

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".pdf": "application/pdf",
};

/**
 * Serve the consent file attached to an appointment.
 *
 * Two sources (first match wins):
 *  1. `appointments.consent_file` — doctor-uploaded at booking (consent_type=upload).
 *  2. `appointment_consult_consents.consent_file` — patient-uploaded or the
 *     auto-generated certificate produced via the consent link.
 *
 * Authenticated + ownership-scoped: only the owning doctor (or their
 * receptionist/admin) can view it. Files live in non-public storage.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!["doctor", "receptionist", "admin"].includes(user.role)) {
    return new Response("Forbidden", { status: 403 });
  }
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;

  const { id: rawId } = await params;
  const appointmentId = Number(rawId);
  if (!Number.isInteger(appointmentId)) return new Response("Not found", { status: 404 });

  const [appt] = await db
    .select({
      consentFile: appointments.consentFile,
      doctorId: appointments.doctorId,
    })
    .from(appointments)
    .where(eq(appointments.id, appointmentId));

  if (!appt) return new Response("Not found", { status: 404 });
  if (appt.doctorId !== doctorId) return new Response("Forbidden", { status: 403 });

  let consentFile = appt.consentFile;
  if (!consentFile) {
    const [consent] = await db
      .select({ consentFile: appointmentConsultConsents.consentFile })
      .from(appointmentConsultConsents)
      .where(eq(appointmentConsultConsents.appointmentId, appointmentId));
    consentFile = consent?.consentFile ?? null;
  }
  if (!consentFile) return new Response("Not found", { status: 404 });

  const ext = path.extname(consentFile).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) return new Response("Unsupported file", { status: 415 });

  // Defend against path traversal: only serve files within the uploads directory.
  const resolved = path.resolve(STORAGE_DIR, consentFile);
  if (!resolved.startsWith(STORAGE_DIR)) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const bytes = await fs.readFile(resolved);
    return new Response(bytes, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="consent${ext}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
