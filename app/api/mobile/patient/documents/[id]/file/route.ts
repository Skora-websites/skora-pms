import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import fs from "node:fs/promises";
import { db } from "@/lib/db";
import { consultationPrescriptionUploads } from "@/lib/db/schema";
import { requireApiRole } from "@/lib/auth/guard";
import { apiError } from "@/app/api/mobile/_helpers";
import { resolveWithinStorage } from "@/lib/utils/uploads";

export const runtime = "nodejs";

const MIME_MAP: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

/**
 * GET /api/mobile/patient/documents/[id]/file — stream patient's health document.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiRole(["patient", "doctor", "admin", "receptionist"]);
  if (user instanceof Response) return user;

  const { id } = await params;
  const docId = Number(id);
  if (!docId || isNaN(docId)) {
    return apiError("Invalid document ID.", 400);
  }

  const [doc] = await db
    .select({
      id: consultationPrescriptionUploads.id,
      patientId: consultationPrescriptionUploads.patientId,
      filePath: consultationPrescriptionUploads.filePath,
      fileType: consultationPrescriptionUploads.fileType,
    })
    .from(consultationPrescriptionUploads)
    .where(
      and(
        eq(consultationPrescriptionUploads.id, docId),
        isNull(consultationPrescriptionUploads.deletedAt)
      )
    )
    .limit(1);

  if (!doc) {
    return apiError("Document not found.", 404);
  }

  // Patients may only access their own documents
  if (user.role === "patient" && doc.patientId !== user.id) {
    return apiError("Forbidden.", 403);
  }

  const absolutePath = resolveWithinStorage(doc.filePath);
  if (!absolutePath) {
    return apiError("Document path is invalid.", 403);
  }

  let fileBytes: Buffer;
  try {
    fileBytes = await fs.readFile(absolutePath);
  } catch {
    return apiError("Document file not found on disk.", 404);
  }

  const ext = (doc.fileType || "pdf").toLowerCase();
  const contentType = MIME_MAP[ext] || "application/octet-stream";

  return new NextResponse(new Uint8Array(fileBytes), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="document_${doc.id}.${ext}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
