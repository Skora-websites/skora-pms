import fs from "node:fs/promises";
import path from "node:path";
import { getCurrentUser } from "@/lib/auth/user";

export const runtime = "nodejs";

const STORAGE_DIR = path.join(process.cwd(), "storage", "uploads");

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!user.profilePhotoPath) return new Response("Not found", { status: 404 });

  const ext = path.extname(user.profilePhotoPath).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) return new Response("Not found", { status: 404 });

  // Path-traversal defense: resolve and verify the file stays inside storage/uploads.
  const filePath = path.resolve(STORAGE_DIR, user.profilePhotoPath);
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