import { NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointmentConsultConsents } from "@/lib/db/schema";

export const runtime = "nodejs";

const STORAGE_DIR = path.join(process.cwd(), "storage", "uploads");

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".pdf": "application/pdf",
};

/**
 * Serve a stored consent file (uploaded document or auto-generated consent PDF).
 *
 * This is a public route (no auth) because consent links are shared via email/WhatsApp.
 * The slug acts as a bearer token — only those with the link can access the file.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const [consent] = await db
    .select({ consentFile: appointmentConsultConsents.consentFile })
    .from(appointmentConsultConsents)
    .where(eq(appointmentConsultConsents.slug, slug));

  if (!consent?.consentFile) {
    return new Response("Not found", { status: 404 });
  }

  const relativePath = consent.consentFile;
  const ext = path.extname(relativePath).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) return new Response("Unsupported file", { status: 415 });

  // Defend against path traversal: only serve files within the uploads directory.
  const resolved = path.resolve(STORAGE_DIR, relativePath);
  if (!resolved.startsWith(STORAGE_DIR)) {
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