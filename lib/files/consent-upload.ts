import "server-only";

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { MAX_CONSENT_FILE_BYTES, mbLabel } from "@/lib/config";
import { sniffDocument } from "@/lib/utils/uploads";

// Uploaded consent files live outside public/ (PHI-safe), served via
// authenticated API routes only.
const CONSENT_FILES_DIR = path.join(process.cwd(), "storage", "uploads", "consent-files");

/**
 * Consent links (and their files) live 7 days after creation — legacy
 * vendor-link parity. Shared by the write path (respondConsent's answer
 * window) and the read path (/api/consents/[slug]/file retention bound) so
 * the two cannot drift — the drift is exactly what produced audit F-04.
 */
export const CONSENT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Save an uploaded consent document (jpg/png/pdf, max 5 MB).
 * Throws Error with a user-friendly message on invalid input.
 * Returns the storage-relative path ("consent-files/<uuid>.<ext>") or null for empty files.
 */
export async function saveConsentFile(file: File): Promise<string | null> {
  if (file.size === 0) return null;
  // Message derived from the configured cap (audit F-25): raising
  // MAX_CONSENT_FILE_SIZE in the environment previously kept saying "5 MB".
  if (file.size > MAX_CONSENT_FILE_BYTES)
    throw new Error(`File must be under ${mbLabel(MAX_CONSENT_FILE_BYTES)} MB.`);
  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = sniffDocument(bytes);
  if (!kind) throw new Error("Only JPG, PNG or PDF files are allowed.");
  const filename = `${crypto.randomUUID()}.${kind}`;
  await fs.mkdir(CONSENT_FILES_DIR, { recursive: true });
  await fs.writeFile(path.join(CONSENT_FILES_DIR, filename), bytes);
  return `consent-files/${filename}`;
}
