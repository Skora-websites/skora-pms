import { NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
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
 * Serve an uploaded lab test report. Authenticated + ownership-scoped:
 * only the booking doctor (or their receptionist/admin) can download it.
 * Files live in non-public storage.
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

  const { id } = await params;
  const bookingId = Number(id);
  if (!Number.isInteger(bookingId)) return new Response("Not found", { status: 404 });

  const [booking] = await db
    .select({ uploadedFilePath: testBookings.uploadedFilePath, doctorId: testBookings.doctorId })
    .from(testBookings)
    .where(eq(testBookings.id, bookingId));

  if (!booking?.uploadedFilePath) return new Response("Not found", { status: 404 });
  if (booking.doctorId !== doctorId) return new Response("Forbidden", { status: 403 });

  const ext = path.extname(booking.uploadedFilePath).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) return new Response("Unsupported file", { status: 415 });

  const resolved = path.resolve(STORAGE_DIR, booking.uploadedFilePath);
  if (!resolved.startsWith(STORAGE_DIR)) return new Response("Forbidden", { status: 403 });

  try {
    const bytes = await fs.readFile(resolved);
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