import fs from "node:fs/promises";
import path from "node:path";
import { getCurrentUser } from "@/lib/auth/user";
import { ensurePatientOfDoctor } from "@/lib/auth/ownership";
import { getPatientPhotoPath } from "@/lib/queries/doctor";

export const runtime = "nodejs";

const PHOTO_DIR = path.join(process.cwd(), "storage", "uploads", "patient-photos");

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!["doctor", "receptionist", "admin"].includes(user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const { id } = await params;
  const patientId = Number(id);
  if (!Number.isInteger(patientId) || patientId <= 0) {
    return new Response("Bad request", { status: 400 });
  }

  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
  const owned = await ensurePatientOfDoctor(doctorId, patientId);
  if (!owned) return new Response("Not found", { status: 404 });

  const photoPath = await getPatientPhotoPath(patientId);
  if (!photoPath) return new Response("Not found", { status: 404 });

  // Defend against path traversal: only serve files within PHOTO_DIR
  const ext = path.extname(photoPath).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) return new Response("Unsupported file", { status: 415 });

  const filePath = path.join(PHOTO_DIR, path.basename(photoPath));
  try {
    const bytes = await fs.readFile(filePath);
    return new Response(bytes, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
