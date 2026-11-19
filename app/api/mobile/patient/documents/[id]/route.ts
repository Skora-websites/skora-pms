import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { consultationPrescriptionUploads } from "@/lib/db/schema";
import { apiError, apiOk, csrfGuard, requirePatientActor } from "@/app/api/mobile/_helpers";
import { safeDeleteStorageFile } from "@/lib/utils/uploads";

export const runtime = "nodejs";

/**
 * DELETE /api/mobile/patient/documents/[id] — delete an uploaded health document.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requirePatientActor();
  if (user instanceof Response) return user;

  const csrf = csrfGuard(request);
  if (csrf) return csrf;

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
    })
    .from(consultationPrescriptionUploads)
    .where(
      and(
        eq(consultationPrescriptionUploads.id, docId),
        eq(consultationPrescriptionUploads.patientId, user.id),
        isNull(consultationPrescriptionUploads.deletedAt)
      )
    )
    .limit(1);

  if (!doc) {
    return apiError("Document not found.", 404);
  }

  // Soft-delete in database
  await db
    .update(consultationPrescriptionUploads)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(consultationPrescriptionUploads.id, docId));

  // Safely delete file from disk
  try {
    await safeDeleteStorageFile(doc.filePath);
  } catch (err) {
    console.error("Failed to delete storage file:", err);
  }

  return apiOk({ id: docId, deleted: true });
}
