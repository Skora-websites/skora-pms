import path from "node:path";

const STORAGE_PREFIX = /^(landing|blogs)\/[a-zA-Z0-9._-]+\.(jpg|png|webp|gif)$/;

/** storage/uploads — every upload lives outside public/ and is served only
 *  through route handlers that verify containment with resolveWithinStorage. */
export const STORAGE_DIR = path.join(process.cwd(), "storage", "uploads");

/**
 * Resolve a stored path against storage/uploads and verify the result stays
 * INSIDE it (audit F-13). The previous pattern —
 *
 *     path.resolve(STORAGE_DIR, p).startsWith(STORAGE_DIR)
 *
 * — is not a containment test: a sibling directory named `uploads-evil`
 * satisfies the bare string prefix. path.relative detects escaping by
 * construction, so one audited implementation serves every route.
 *
 * Returns the absolute path, or null when the resolved path escapes
 * storage/uploads (caller responds 403/404).
 */
export function resolveWithinStorage(storedPath: string): string | null {
  const resolved = path.resolve(STORAGE_DIR, storedPath);
  const rel = path.relative(STORAGE_DIR, resolved);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return resolved;
}

/** Safely delete a file inside storage/uploads, preventing path traversal. */
export async function safeDeleteStorageFile(storedPath: string | null | undefined): Promise<void> {
  if (!storedPath) return;
  const target = resolveWithinStorage(storedPath);
  if (!target) return;
  try {
    const fs = await import("node:fs/promises");
    await fs.unlink(target);
  } catch {
    // Already deleted or inaccessible
  }
}

/** Sniff image format (jpg, png, webp, gif) from buffer magic bytes. */
export function sniffImage(bytes: Buffer): "jpg" | "png" | "webp" | "gif" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "png";
  }
  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("latin1") === "RIFF" &&
    bytes.subarray(8, 12).toString("latin1") === "WEBP"
  ) {
    return "webp";
  }
  if (
    bytes.length >= 6 &&
    (bytes.subarray(0, 6).toString("latin1") === "GIF87a" ||
      bytes.subarray(0, 6).toString("latin1") === "GIF89a")
  ) {
    return "gif";
  }
  return null;
}

/** Sniff document or image format (pdf, jpg, png, webp, gif) from buffer magic bytes. */
export function sniffDocument(bytes: Buffer): "pdf" | "jpg" | "png" | "webp" | "gif" | null {
  if (
    (bytes.length >= 5 && bytes.subarray(0, 5).toString("latin1") === "%PDF-") ||
    (bytes.length >= 6 &&
      bytes[0] === 0xef &&
      bytes[1] === 0xbb &&
      bytes[2] === 0xbf &&
      bytes.subarray(3, 8).toString("latin1") === "%PDF-")
  ) {
    return "pdf";
  }
  return sniffImage(bytes);
}

/**
 * Public URL for a CMS-stored upload, or null when the row has no usable
 * image. Seeded legacy rows carry static-asset paths ("front-assets/...")
 * that never existed in this app — those (and null) fall back so callers
 * can render their default visual instead of a broken image icon.
 */
export function publicUploadUrl(storedPath: string | null | undefined): string | null {
  if (!storedPath) return null;
  const normalized = storedPath.replace(/^uploads\//, "");
  return STORAGE_PREFIX.test(normalized) ? `/api/public/file/${normalized}` : null;
}

