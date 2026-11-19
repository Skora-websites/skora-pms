import { NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import fs from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { consultationPrescriptionUploads, users } from "@/lib/db/schema";
import { apiError, apiOk, csrfGuard, requirePatientActor } from "@/app/api/mobile/_helpers";
import { resolveWithinStorage, sniffDocument, STORAGE_DIR } from "@/lib/utils/uploads";

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

export type DocumentCategory = (typeof ALLOWED_CATEGORIES)[number];

type DocumentMeta = {
  title: string;
  category: DocumentCategory;
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
          category: ALLOWED_CATEGORIES.includes(parsed.category) ? parsed.category : "other",
          recordDate: typeof parsed.recordDate === "string" ? parsed.recordDate : fallbackDate.toISOString().slice(0, 10),
          fileSize: typeof parsed.fileSize === "number" ? parsed.fileSize : 0,
          comment: typeof parsed.comment === "string" ? parsed.comment : undefined,
        };
      }
    } catch {
      // not JSON, fallback to plain text note
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
 * GET /api/mobile/patient/documents — list patient's uploaded external health records.
 */
export async function GET() {
  const user = await requirePatientActor();
  if (user instanceof Response) return user;

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
        eq(consultationPrescriptionUploads.patientId, user.id),
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

/**
 * POST /api/mobile/patient/documents — upload a new health document.
 * Accepts both application/json (with base64 file) and multipart/form-data.
 */
export async function POST(request: Request) {
  const user = await requirePatientActor();
  if (user instanceof Response) return user;

  const csrf = csrfGuard(request);
  if (csrf) return csrf;

  let buffer: Buffer | null = null;
  let originalName = "document.pdf";
  let title = "Medical Document";
  let category: DocumentCategory = "other";
  let recordDate = new Date().toISOString().slice(0, 10);
  let comment: string | undefined;

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    let body: {
      fileName?: string;
      fileBase64?: string;
      title?: string;
      category?: string;
      recordDate?: string;
      notes?: string;
    };
    try {
      body = await request.json();
    } catch {
      return apiError("Invalid JSON body.", 400);
    }

    if (!body.fileBase64) {
      return apiError("fileBase64 is required.", 400);
    }

    const base64Clean = body.fileBase64.replace(/^data:[^;]+;base64,/, "");
    buffer = Buffer.from(base64Clean, "base64");
    if (body.fileName) originalName = body.fileName;
    if (body.title?.trim()) title = body.title.trim().slice(0, 100);
    if (body.category && ALLOWED_CATEGORIES.includes(body.category as DocumentCategory)) {
      category = body.category as DocumentCategory;
    }
    if (body.recordDate) recordDate = body.recordDate;
    if (body.notes?.trim()) comment = body.notes.trim().slice(0, 500);
  } else if (contentType.includes("multipart/form-data")) {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return apiError("Invalid multipart form data.", 400);
    }

    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) {
      return apiError("A file is required.", 400);
    }

    const arrayBuf = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuf);
    if (typeof (file as File).name === "string" && (file as File).name) {
      originalName = (file as File).name;
    }

    const formTitle = formData.get("title");
    if (typeof formTitle === "string" && formTitle.trim()) title = formTitle.trim().slice(0, 100);

    const formCategory = formData.get("category");
    if (typeof formCategory === "string" && ALLOWED_CATEGORIES.includes(formCategory as DocumentCategory)) {
      category = formCategory as DocumentCategory;
    }

    const formRecordDate = formData.get("recordDate");
    if (typeof formRecordDate === "string" && formRecordDate.trim()) recordDate = formRecordDate.trim();

    const formNotes = formData.get("notes");
    if (typeof formNotes === "string" && formNotes.trim()) comment = formNotes.trim().slice(0, 500);
  } else {
    return apiError("Unsupported Content-Type. Use multipart/form-data or application/json.", 415);
  }

  if (!buffer || buffer.length === 0) {
    return apiError("File is empty.", 400);
  }

  // Max 10MB
  if (buffer.length > 10 * 1024 * 1024) {
    return apiError("File exceeds 10MB limit.", 400);
  }

  // Sniff magic bytes
  const sniffedExt = sniffDocument(buffer);
  if (!sniffedExt) {
    return apiError("Invalid file type. Only PDF and image formats (JPEG, PNG, WebP) are allowed.", 400);
  }

  // Sanitize filename & extension
  const safeBase = path.basename(originalName, path.extname(originalName)).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 50);
  const targetFileName = `${Date.now()}_${safeBase}.${sniffedExt}`;
  const relativeDir = path.posix.join("patient_documents", String(user.id));
  const absoluteDir = path.join(STORAGE_DIR, "patient_documents", String(user.id));

  await fs.mkdir(absoluteDir, { recursive: true });
  const absoluteTarget = path.join(absoluteDir, targetFileName);
  await fs.writeFile(absoluteTarget, buffer);

  const storedPath = path.posix.join(relativeDir, targetFileName);

  // Resolve an assigned or default doctor
  let doctorId = user.doctorId;
  if (!doctorId) {
    const [firstDoc] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "doctor"))
      .limit(1);
    doctorId = firstDoc?.id ?? user.id;
  }

  const meta: DocumentMeta = {
    title,
    category,
    recordDate,
    fileSize: buffer.length,
    comment,
  };

  const [insertResult] = await db.insert(consultationPrescriptionUploads).values({
    patientId: user.id,
    doctorId,
    filePath: storedPath,
    fileType: sniffedExt,
    notes: JSON.stringify(meta),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const insertedId = Number(insertResult.insertId);

  return apiOk(
    {
      id: insertedId,
      title,
      category,
      recordDate,
      fileType: sniffedExt,
      fileSize: buffer.length,
      notes: comment || null,
      fileUrl: `/api/mobile/patient/documents/${insertedId}/file`,
      createdAt: new Date().toISOString(),
    },
    { status: 201 }
  );
}
