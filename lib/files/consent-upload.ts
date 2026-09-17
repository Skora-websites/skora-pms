import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

// Uploaded consent files live outside public/ (PHI-safe), served via
// authenticated API routes only.
const CONSENT_FILES_DIR = path.join(process.cwd(), "storage", "uploads", "consent-files");

export const MAX_CONSENT_FILE_BYTES = 5 * 1024 * 1024;

/** Magic-byte check — only real JPG/PNG/PDF files pass (spoofed extensions rejected). */
function sniffConsentFile(bytes: Buffer): "jpg" | "png" | "pdf" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return "png";
  if (bytes.length >= 5 && bytes.subarray(0, 5).toString("latin1") === "%PDF-") return "pdf";
  return null;
}

/**
 * Save an uploaded consent document (jpg/png/pdf, max 5 MB).
 * Throws Error with a user-friendly message on invalid input.
 * Returns the storage-relative path ("consent-files/<uuid>.<ext>") or null for empty files.
 */
export async function saveConsentFile(file: File): Promise<string | null> {
  if (file.size === 0) return null;
  if (file.size > MAX_CONSENT_FILE_BYTES) throw new Error("File must be under 5 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = sniffConsentFile(bytes);
  if (!kind) throw new Error("Only JPG, PNG or PDF files are allowed.");
  const filename = `${crypto.randomUUID()}.${kind}`;
  await fs.mkdir(CONSENT_FILES_DIR, { recursive: true });
  await fs.writeFile(path.join(CONSENT_FILES_DIR, filename), bytes);
  return `consent-files/${filename}`;
}
