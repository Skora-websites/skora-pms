import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";
import { isPracticeDoctor } from "@/lib/queries/clinic";

export const runtime = "nodejs";

const STORAGE_DIR = path.join(process.cwd(), "storage", "uploads");

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

/**
 * Serves the signed-in user's photo, or — with ?user_id= — a practice
 * doctor's photo (member profile cards). Practice scoping prevents probing
 * arbitrary users' photos.
 */
export async function GET(request: Request) {
  const viewer = await getCurrentUser();
  if (!viewer) return new Response("Unauthorized", { status: 401 });

  const viewerDoctorId = viewer.role === "receptionist" ? (viewer.doctorId ?? viewer.id) : viewer.id;
  const requestedId = Number(new URL(request.url).searchParams.get("user_id") ?? "");
  const targetId = Number.isInteger(requestedId) && requestedId > 0 ? requestedId : viewer.id;

  let photoPath: string | null;
  if (targetId === viewer.id) {
    photoPath = viewer.profilePhotoPath;
  } else if (
    (viewer.role === "doctor" || viewer.role === "receptionist" || viewer.role === "admin") &&
    (await isPracticeDoctor(viewerDoctorId, targetId))
  ) {
    const [row] = await db
      .select({ profilePhotoPath: users.profilePhotoPath })
      .from(users)
      .where(eq(users.id, targetId));
    photoPath = row?.profilePhotoPath ?? null;
  } else {
    return new Response("Forbidden", { status: 403 });
  }

  if (!photoPath) return new Response("Not found", { status: 404 });

  const ext = path.extname(photoPath).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) return new Response("Not found", { status: 404 });

  // Path-traversal defense: resolve and verify the file stays inside storage/uploads.
  const filePath = path.resolve(STORAGE_DIR, photoPath);
  if (!filePath.startsWith(STORAGE_DIR)) return new Response("Forbidden", { status: 403 });

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
