import { NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { doctorClinics } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";

export const runtime = "nodejs";

const STORAGE_DIR = path.join(process.cwd(), "storage", "uploads");

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/**
 * Serve a clinic logo. Logos are not PHI but are stored outside public/
 * for consistency — only authenticated staff can view them.
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
  const clinicId = Number(id);
  if (!Number.isInteger(clinicId)) return new Response("Not found", { status: 404 });

  const [clinic] = await db
    .select({ clinicLogo: doctorClinics.clinicLogo, doctorId: doctorClinics.doctorId })
    .from(doctorClinics)
    .where(eq(doctorClinics.id, clinicId));

  if (!clinic?.clinicLogo) return new Response("Not found", { status: 404 });
  if (clinic.doctorId !== doctorId) return new Response("Forbidden", { status: 403 });

  const ext = path.extname(clinic.clinicLogo).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) return new Response("Unsupported file", { status: 415 });

  const resolved = path.resolve(STORAGE_DIR, clinic.clinicLogo);
  if (!resolved.startsWith(STORAGE_DIR)) return new Response("Forbidden", { status: 403 });

  try {
    const bytes = await fs.readFile(resolved);
    return new Response(bytes, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}