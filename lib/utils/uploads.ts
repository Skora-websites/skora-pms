const STORAGE_PREFIX = /^(landing|blogs)\/[a-zA-Z0-9._-]+\.(jpg|png|webp|gif)$/;

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
