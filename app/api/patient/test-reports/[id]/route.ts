import { NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { testBookings } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";
import { audit } from "@/lib/security/audit-log";

export const runtime = "nodejs";

const STORAGE_DIR = path.join(process.cwd(), "storage", "uploads");

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

/**
 * Serve a lab test report to the PATIENT who owns the booking.
 * (Doctors use /api/doctor/test-bookings/[id]/report.)
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (user.role !== "patient") return new Response("Forbidden", { status: 403 });

  const { id } = await params;
  const bookingId = Number(id);
  if (!Number.isInteger(bookingId)) return new Response("Not found", { status: 404 });

  const [booking] = await db
    .select({ uploadedFilePath: testBookings.uploadedFilePath, patientId: testBookings.patientId })
    .from(testBookings)
    .where(and(eq(testBookings.id, bookingId), eq(testBookings.patientId, user.id)));

  if (!booking?.uploadedFilePath) return new Response("Not found", { status: 404 });

  const ext = path.extname(booking.uploadedFilePath).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) return new Response("Unsupported file", { status: 415 });

  const resolved = path.resolve(STORAGE_DIR, booking.uploadedFilePath);
  if (!resolved.startsWith(STORAGE_DIR)) return new Response("Forbidden", { status: 403 });

  try {
    const bytes = await fs.readFile(resolved);
    // Empty / blank report guard (mirrors the doctor-side route): a PDF with
    // no visible content renders as a blank viewer page — explain instead.
    if (contentType === "application/pdf" && !pdfHasVisibleContent(bytes)) {
      return new Response(
        `<!doctype html><html><head><meta charset="utf-8"><title>Report is blank</title></head>
<body style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc">
<div style="max-width:420px;text-align:center;padding:2.5rem;background:#fff;border:1px solid #e2e8f0;border-radius:1rem">
<div style="font-size:2.5rem">📄</div>
<h1 style="font-size:1.05rem;color:#0f172a;margin:0.75rem 0 0.5rem">This report has no visible content</h1>
<p style="font-size:0.85rem;color:#64748b;line-height:1.6;margin:0 0 1.25rem">
The uploaded file appears to be blank. Please contact your clinic — they will ask the lab to re-upload the correct report.
</p>
<a href="javascript:history.back()" style="display:inline-block;padding:0.5rem 1.25rem;border-radius:999px;background:#0e382b;color:#fff;font-size:0.8rem;font-weight:600;text-decoration:none">Go back</a>
</div>
</div></body></html>`,
        {
          status: 422,
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store" },
        }
      );
    }

    void audit.fileUploaded(user.id, { bookingId, action: "patient_report_download" });
    return new Response(bytes, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="report-${bookingId}${ext}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

/**
 * True when a PDF byte buffer contains at least one page with visible content
 * (text or drawing operators). Blank reports — e.g. empty uploads with no
 * content stream at all — return false.
 */
function pdfHasVisibleContent(bytes: Buffer): boolean {
  const raw = bytes.toString("latin1");
  if (!raw.startsWith("%PDF-")) return true; // not a (valid) PDF — let content-type checks handle it
  const streams = raw.match(/stream\r?\n([\s\S]*?)endstream/g) ?? [];
  for (const chunk of streams) {
    const body = chunk.replace(/^stream\r?\n/, "").replace(/endstream$/, "");
    let content = body;
    try {
      // Flate-encoded content streams are the norm; fall back to raw bytes.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const zlib = require("node:zlib") as typeof import("node:zlib");
      content = zlib.inflateSync(Buffer.from(body, "latin1")).toString("latin1");
    } catch {
      /* raw stream */
    }
    if (/\bTj\b|\bTJ\b|\bre\b|\bf\b|\bS\b|\bDo\b|\bBI\b/.test(content)) return true;
  }
  return false;
}