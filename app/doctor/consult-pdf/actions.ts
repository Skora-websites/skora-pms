"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { doctorConsultPdfs } from "@/lib/db/schema";
import { getCurrentUser, hasPermission } from "@/lib/auth/user";

export type ConsultPdfActionResult = { error: string | null };

// Stored outside public/ so PHI documents are never directly served.
const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads", "doctor-consult-pdfs");

export async function uploadConsultPdf(
  _prev: ConsultPdfActionResult,
  formData: FormData
): Promise<ConsultPdfActionResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["doctor", "receptionist", "admin"].includes(user.role)) {
    return { error: "Not authorized." };
  }
  if (!(await hasPermission(user.id, "dashboard"))) {
    return { error: "You don't have permission to upload consultation PDFs." };
  }
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;

  const file = formData.get("pdf") as File | null;
  if (!file || file.size === 0) return { error: "Please choose a PDF file." };
  if (file.size > 10 * 1024 * 1024) return { error: "File must be under 10 MB." };

  const bytes = Buffer.from(await file.arrayBuffer());

  // Magic-byte check: PDFs start with "%PDF-" (optionally with a BOM).
  const hasPdfSignature =
    (bytes.length >= 5 && bytes.subarray(0, 5).toString("latin1") === "%PDF-") ||
    (bytes.length >= 6 &&
      bytes[0] === 0xef &&
      bytes[1] === 0xbb &&
      bytes[2] === 0xbf &&
      bytes.subarray(3, 8).toString("latin1") === "%PDF-");
  if (!hasPdfSignature) {
    return { error: "Only PDF files are allowed." };
  }

  // Random, unguessable filename — never echo the user-supplied name on disk.
  const filename = `${doctorId}-${crypto.randomUUID()}.pdf`;

  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, filename), bytes);
  } catch (err) {
    console.error("Failed to store consult PDF:", err);
    return { error: "Could not save the file. Please try again." };
  }

  const storedPath = `doctor-consult-pdfs/${filename}`;
  const now = new Date();

  const [existing] = await db
    .select({ id: doctorConsultPdfs.id, pdfPath: doctorConsultPdfs.pdfPath })
    .from(doctorConsultPdfs)
    .where(eq(doctorConsultPdfs.doctorId, doctorId));

  if (existing) {
    // Replace the old file (best-effort cleanup).
    if (existing.pdfPath) {
      const oldFile = path.join(UPLOAD_DIR, path.basename(existing.pdfPath));
      fs.unlink(oldFile).catch(() => undefined);
    }
    await db
      .update(doctorConsultPdfs)
      .set({ pdfPath: storedPath, updatedAt: now })
      .where(eq(doctorConsultPdfs.id, existing.id));
  } else {
    await db.insert(doctorConsultPdfs).values({ doctorId, pdfPath: storedPath, createdAt: now, updatedAt: now });
  }

  revalidatePath("/doctor/consult-pdf");
  return { error: null };
}
