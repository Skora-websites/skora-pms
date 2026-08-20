"use server";

import { revalidatePath } from "next/cache";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { testBookings } from "@/lib/db/schema";
import { audit } from "@/lib/security/audit-log";

export type VendorUploadResult = { error: string | null; success?: boolean };

const REPORT_DIR = path.join(process.cwd(), "storage", "uploads", "test-reports");

/** Magic-byte check — only real PDF/JPEG/PNG files pass (spoofed extensions rejected). */
function sniffFile(bytes: Buffer): "pdf" | "jpg" | "png" | null {
  if (
    (bytes.length >= 5 && bytes.subarray(0, 5).toString("latin1") === "%PDF-") ||
    (bytes.length >= 6 &&
      bytes[0] === 0xef &&
      bytes[1] === 0xbb &&
      bytes[2] === 0xbf &&
      bytes.subarray(3, 8).toString("latin1") === "%PDF-")
  ) {
    return "pdf";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "png";
  }
  return null;
}

/**
 * Vendor uploads a lab test report via a token link. The token grants access
 * to exactly one booking — no authentication required (legacy parity), but the
 * file is stored outside public/ and validated by magic bytes.
 */
export async function uploadTestReport(
  token: string,
  formData: FormData
): Promise<VendorUploadResult> {
  const [booking] = await db
    .select({
      id: testBookings.id,
      doctorId: testBookings.doctorId,
      patientId: testBookings.patientId,
      uploadLinkToken: testBookings.uploadLinkToken,
    })
    .from(testBookings)
    .where(eq(testBookings.uploadLinkToken, token));

  if (!booking) return { error: "Invalid or expired upload link." };
  if (booking.uploadLinkToken !== token) return { error: "Invalid or expired upload link." };

  const file = formData.get("test_report") as File | null;
  if (!file || file.size === 0) return { error: "Please choose a report file." };
  if (file.size > 5 * 1024 * 1024) return { error: "Report must be under 5 MB." };

  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = sniffFile(bytes);
  if (!kind) return { error: "Only PDF, JPG or PNG reports are allowed." };

  const filename = `${crypto.randomUUID()}.${kind}`;
  const relativePath = `test-reports/${filename}`;
  await fs.mkdir(REPORT_DIR, { recursive: true });
  await fs.writeFile(path.join(REPORT_DIR, filename), bytes);

  await db
    .update(testBookings)
    .set({
      uploadedFilePath: relativePath,
      status: "completed",
      updatedAt: new Date(),
    })
    .where(eq(testBookings.id, booking.id));

  void audit.fileUploaded(booking.doctorId, {
    bookingId: booking.id,
    patientId: booking.patientId,
    action: "vendor_report_uploaded",
  });

  revalidatePath("/doctor/test-bookings");
  return { error: null, success: true };
}