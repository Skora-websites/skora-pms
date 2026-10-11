import fs from "node:fs/promises";
import path from "node:path";
import { requireApiPermission } from "@/lib/auth/guard";
import { ensurePatientOfDoctor } from "@/lib/auth/ownership";
import { resolveWithinStorage } from "@/lib/utils/uploads";
import { getPatientPhotoPath } from "@/lib/queries/doctor";

export const runtime = "nodejs";

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
  // Module permission matches the /doctor/patients page (`registrations`,
  // audit F-01) — the roster and its photos share one module.
  const user = await requireApiPermission(["doctor", "receptionist"], "registrations");
  if (user instanceof Response) return user;

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

  const filePath = resolveWithinStorage(photoPath);
  if (!filePath) return new Response("Forbidden", { status: 403 });
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
