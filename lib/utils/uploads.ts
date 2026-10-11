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
