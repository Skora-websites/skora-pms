import { NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointmentConsultConsents, appointments } from "@/lib/db/schema";
import { CONSENT_TTL_MS } from "@/lib/files/consent-upload";
import { resolveWithinStorage } from "@/lib/utils/uploads";

export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".pdf": "application/pdf",
};

/**
 * Serve a stored consent file (auto-generated certificate produced on
 * acceptance, or an uploaded document).
 *
 * This is a public route (no auth) because consent links are shared via email/WhatsApp.
 * The slug acts as a bearer token — only those with the link can access the file.
 *
 * The slug being unguessable does not make retention unbounded: the read path
 * enforces the same invariants the write path already does (audit F-04):
 *   1. only ACCEPTED consents have a certificate — undecided/rejected have
 *      nothing legitimate to serve;
 *   2. a cancelled appointment has no live consent behind it;
 *   3. everything expires CONSENT_TTL_MS after creation — the same window
 *      respondConsent uses for answering. A leaked link dies with the window.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const [consent] = await db
    .select({
      consentFile: appointmentConsultConsents.consentFile,
      isAccepted: appointmentConsultConsents.isAccepted,
      createdAt: appointmentConsultConsents.createdAt,
      appointmentStatus: appointments.status,
    })
    .from(appointmentConsultConsents)
    .leftJoin(appointments, eq(appointments.id, appointmentConsultConsents.appointmentId))
    .where(eq(appointmentConsultConsents.slug, slug));

  if (!consent?.consentFile) {
    return new Response("Not found", { status: 404 });
  }

  // 1. Only an accepted consent carries a servable certificate. Rejected and
  //    undecided records must never disclose their (uploaded) file here.
  if (!consent.isAccepted) {
    return new Response("Not found", { status: 404 });
  }

  // 2. The appointment the consent was issued for is no longer live.
  if (consent.appointmentStatus === "cancelled") {
    return new Response("Not found", { status: 404 });
  }

  // 3. Retention bound — same 7-day window as the answer path.
  if (
    consent.createdAt &&
    Date.now() - new Date(consent.createdAt).getTime() > CONSENT_TTL_MS
  ) {
    return new Response("Not found", { status: 404 });
  }

  const relativePath = consent.consentFile;
  const ext = path.extname(relativePath).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) return new Response("Unsupported file", { status: 415 });

  // Defend against path traversal: only serve files within the uploads directory.
  const resolved = resolveWithinStorage(relativePath);
  if (!resolved) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const bytes = await fs.readFile(resolved);
    const disposition = ext === ".pdf" ? "inline" : "inline";
    return new Response(bytes, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${disposition}; filename="consent${ext}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}