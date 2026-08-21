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
    void audit.fileUploaded(user.id, { bookingId, action: "patient_report_download" });
    return new Response(bytes, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="report-${bookingId}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}