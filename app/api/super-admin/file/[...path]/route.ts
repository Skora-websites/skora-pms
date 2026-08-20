import { NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { getCurrentUser } from "@/lib/auth/user";

export const runtime = "nodejs";

const STORAGE_DIR = path.join(process.cwd(), "storage", "uploads");
const ALLOWED_DIRS = new Set(["clinic", "blogs", "landing", "company", "support-videos"]);

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m4v": "video/x-m4v",
};

/**
 * Serve uploaded files (clinic logos, blog images, landing images, company
 * logos, support videos) that live outside the public directory. Access is
 * limited to authenticated super admins / admins.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!["super_admin", "admin"].includes(user.role)) {
    return new Response("Forbidden", { status: 403 });
  }

  const segments = (await params).path;
  if (segments.length < 2 || !ALLOWED_DIRS.has(segments[0])) {
    return new Response("Not found", { status: 404 });
  }
  if (segments.some((s) => !/^[a-zA-Z0-9._-]+$/.test(s))) {
    return new Response("Not found", { status: 404 });
  }

  const relative = segments.join("/");
  const resolved = path.resolve(STORAGE_DIR, relative);
  if (!resolved.startsWith(STORAGE_DIR)) return new Response("Forbidden", { status: 403 });

  const ext = path.extname(resolved).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) return new Response("Unsupported file", { status: 415 });

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