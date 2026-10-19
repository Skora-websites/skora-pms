import { NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { testBookings } from "@/lib/db/schema";
import { requireApiPermission } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { audit } from "@/lib/security/audit-log";
import { resolveWithinStorage } from "@/lib/utils/uploads";

export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

/**
 * Serve an uploaded lab test report. Authenticated + ownership-scoped:
 * only the booking doctor (or their receptionist/admin) can download it.
 * Files live in non-public storage.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Module permission matches the /doctor/test-bookings page (audit F-01).
  // The admin tier (owner/manager) shares that page's UI, so it must be able
  // to download its own business's reports — it previously got a hard 403.
  const user = await requireApiPermission(
    ["doctor", "receptionist", "admin", "manager"],
    "test-booking"
  );
  if (user instanceof Response) return user;

  // Row-level scope: staff act as one doctor; the admin tier acts across the
  // doctors of the businesses it owns/is assigned to.
  const doctorIds =
    user.role === "receptionist"
      ? [user.doctorId ?? user.id]
      : user.role === "doctor"
        ? [user.id]
        : (await getBusinessScope()).doctorIds;

  const { id } = await params;
  const bookingId = Number(id);
  if (!Number.isInteger(bookingId)) return new Response("Not found", { status: 404 });

  const [booking] = await db
    .select({ uploadedFilePath: testBookings.uploadedFilePath, doctorId: testBookings.doctorId })
    .from(testBookings)
    .where(and(eq(testBookings.id, bookingId), inArray(testBookings.doctorId, doctorIds)));

  if (!booking?.uploadedFilePath) return new Response("Not found", { status: 404 });

  const ext = path.extname(booking.uploadedFilePath).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) return new Response("Unsupported file", { status: 415 });

  const resolved = resolveWithinStorage(booking.uploadedFilePath);
  if (!resolved) return new Response("Forbidden", { status: 403 });

  try {
    const bytes = await fs.readFile(resolved);

    // Empty / blank report guard: a PDF with no page-content operators renders
    // as a blank viewer page. Rather than serving it ("View report" would look
    // broken), tell the user the report file has no visible content so they
    // contact the vendor for a re-upload instead of doubting their device.
    if (contentType === "application/pdf" && !pdfHasVisibleContent(bytes)) {
      return new Response(
        `<!doctype html><html><head><meta charset="utf-8"><title>Report is blank</title></head>
<body style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc">
<div style="max-width:420px;text-align:center;padding:2.5rem;background:#fff;border:1px solid #e2e8f0;border-radius:1rem">
<div style="font-size:2.5rem">📄</div>
<h1 style="font-size:1.05rem;color:#0f172a;margin:0.75rem 0 0.5rem">This report has no visible content</h1>
<p style="font-size:0.85rem;color:#64748b;line-height:1.6;margin:0 0 1.25rem">
The uploaded file appears to be blank (0 pages of content). Please ask the lab vendor to re-upload the correct report — use “Regenerate upload link” on the Test Bookings page.
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

    void audit.fileUploaded(user.id, { bookingId, action: "report_download" });
    return new Response(bytes, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="test-report${ext}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

/**
 * True when a PDF byte buffer contains at least one page with visible content
 * (text or drawing operators). Blank reports — e.g. empty test fixtures with
 * no content stream at all — return false.
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