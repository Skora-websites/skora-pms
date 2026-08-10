"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { doctorConsultPdfs } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";

export type ConsultPdfActionResult = { error: string | null };

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "doctor-consult-pdfs");

export async function uploadConsultPdf(
  _prev: ConsultPdfActionResult,
  formData: FormData
): Promise<ConsultPdfActionResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["doctor", "receptionist", "admin"].includes(user.role)) {
    return { error: "Not authorized." };
  }
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;

  const file = formData.get("pdf") as File | null;
  if (!file || file.size === 0) return { error: "Please choose a PDF file." };
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return { error: "Only PDF files are allowed." };
  }
  if (file.size > 10 * 1024 * 1024) return { error: "File must be under 10 MB." };

  const safeName = file.name.replace(/[^\w.\-() ]/g, "").trim() || "consult.pdf";
  const filename = `${doctorId}-${Date.now()}-${safeName}`;

  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const bytes = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(UPLOAD_DIR, filename), bytes);
  } catch (err) {
    console.error("Failed to store consult PDF:", err);
    return { error: "Could not save the file. Please try again." };
  }

  const publicPath = `uploads/doctor-consult-pdfs/${filename}`;
  const now = new Date();

  const [existing] = await db
    .select({ id: doctorConsultPdfs.id, pdfPath: doctorConsultPdfs.pdfPath })
    .from(doctorConsultPdfs)
    .where(eq(doctorConsultPdfs.doctorId, doctorId));

  if (existing) {
    // Replace the old file (best-effort cleanup).
    if (existing.pdfPath) {
      const oldFile = path.join(process.cwd(), "public", existing.pdfPath);
      fs.unlink(oldFile).catch(() => undefined);
    }
    await db
      .update(doctorConsultPdfs)
      .set({ pdfPath: publicPath, updatedAt: now })
      .where(eq(doctorConsultPdfs.id, existing.id));
  } else {
    await db.insert(doctorConsultPdfs).values({ doctorId, pdfPath: publicPath, createdAt: now, updatedAt: now });
  }

  revalidatePath("/doctor/consult-pdf");
  return { error: null };
}
