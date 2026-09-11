import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const STORAGE_DIR = path.join(process.cwd(), "storage", "uploads");
// Only CMS assets the public marketing site legitimately renders. SVG is
// excluded on purpose: uploads never produce it (magic-byte sniff is jpg/
// png/webp/gif only) and served SVG can embed same-origin script.
const ALLOWED_DIRS = new Set(["landing", "blogs"]);

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/**
 * GET /api/public/file/landing/<uuid>.png — anonymous image serving for
 * CMS-driven landing and blog content. UUID filenames are immutable, so the
 * response is cacheable; anything else stays behind the authenticated
 * /api/super-admin/file route.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const segments = (await params).path;
  if (segments.length !== 2 || !ALLOWED_DIRS.has(segments[0])) {
    return new Response("Not found", { status: 404 });
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(segments[1]) || segments[1] === "." || segments[1] === "..") {
    return new Response("Not found", { status: 404 });
  }

  const resolved = path.resolve(STORAGE_DIR, segments.join("/"));
  if (!resolved.startsWith(STORAGE_DIR)) return new Response("Forbidden", { status: 403 });

  const contentType = CONTENT_TYPES[path.extname(resolved).toLowerCase()];
  if (!contentType) return new Response("Unsupported file", { status: 415 });

  try {
    const bytes = await fs.readFile(resolved);
    return new Response(bytes, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
