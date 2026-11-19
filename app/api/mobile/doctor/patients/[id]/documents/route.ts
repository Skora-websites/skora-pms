import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { consultationPrescriptionUploads, users } from "@/lib/db/schema";
import { apiError, apiOk, requireDoctorActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

const ALLOWED_CATEGORIES = [
  "prescription",
  "lab_report",
  "discharge_summary",
  "vaccine",
  "scan",
  "insurance",
  "other",
] as const;

type DocumentMeta = {
  title: string;
  category: string;
  recordDate: string;
  fileSize: number;
  comment?: string;
};

function parseMeta(notes: string | null, fallbackDate: Date): DocumentMeta {
  if (notes) {
    try {
      const parsed = JSON.parse(notes);
      if (typeof parsed === "object" && parsed !== null) {
        return {
          title: typeof parsed.title === "string" ? parsed.title : "Medical Document",
          category: typeof parsed.category === "string" ? parsed.category : "other",
          recordDate: typeof parsed.recordDate === "string" ? parsed.recordDate : fallbackDate.toISOString().slice(0, 10),
          fileSize: typeof parsed.fileSize === "number" ? parsed.fileSize : 0,
          comment: typeof parsed.comment === "string" ? parsed.comment : undefined,
        };
      }
    } catch {
      return {
        title: notes.slice(0, 60),
        category: "other",
        recordDate: fallbackDate.toISOString().slice(0, 10),
        fileSize: 0,
        comment: notes,
      };
    }
  }
  return {
    title: "Medical Document",
    category: "other",
    recordDate: fallbackDate.toISOString().slice(0, 10),
    fileSize: 0,
  };
}

/**
 * GET /api/mobile/doctor/patients/[id]/documents — patient's document locker for doctor review.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireDoctorActor();
  if (user instanceof Response) return user;

  const { id } = await params;
  const patientId = Number(id);
  if (!patientId || isNaN(patientId)) {
    return apiError("Invalid patient ID.", 400);
  }

  // Verify patient exists
  const [patient] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(and(eq(users.id, patientId), eq(users.role, "patient")))
    .limit(1);

  if (!patient) {
    return apiError("Patient not found.", 404);
  }

  const rows = await db
    .select({
      id: consultationPrescriptionUploads.id,
      patientId: consultationPrescriptionUploads.patientId,
      filePath: consultationPrescriptionUploads.filePath,
      fileType: consultationPrescriptionUploads.fileType,
      notes: consultationPrescriptionUploads.notes,
      createdAt: consultationPrescriptionUploads.createdAt,
    })
    .from(consultationPrescriptionUploads)
    .where(
      and(
        eq(consultationPrescriptionUploads.patientId, patientId),
        isNull(consultationPrescriptionUploads.deletedAt)
      )
    )
    .orderBy(desc(consultationPrescriptionUploads.createdAt));

  const items = rows.map((r) => {
    const fallbackDate = r.createdAt ?? new Date();
    const meta = parseMeta(r.notes, fallbackDate);
    return {
      id: r.id,
      title: meta.title,
      category: meta.category,
      recordDate: meta.recordDate,
      fileType: r.fileType || "pdf",
      fileSize: meta.fileSize,
      notes: meta.comment || null,
      fileUrl: `/api/mobile/patient/documents/${r.id}/file`,
      createdAt: fallbackDate.toISOString(),
    };
  });

  return apiOk(items);
}
