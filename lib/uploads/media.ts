import "server-only";

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, mbLabel } from "@/lib/config";

/**
 * Upload helpers shared by the super-admin actions.
 *
 * Extracted from the former monolithic app/super-admin/actions.ts. The
 * magic-byte sniffing is the security-relevant part: a client can name a file
 * `.png` while it is really something else, and the stored name is trusted by
 * the public file-serving routes, so the extension is decided here from the
 * bytes and never from the upload.
 */

const UPLOAD_ROOT = path.join(process.cwd(), "storage", "uploads");

/** Only allow sane relative storage paths — blocks traversal. */
const DATE_SAFE = /^[a-zA-Z0-9._/-]+$/;

function sniffImage(bytes: Buffer): "jpg" | "png" | "webp" | "gif" | null {
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

/** Sniff real video containers from magic bytes (extension can be spoofed). */
function sniffVideo(bytes: Buffer): "mp4" | "webm" | "mov" | "m4v" | null {
  if (bytes.length < 12) return null;
  // MP4/MOV/M4V are ISO-BMFF: bytes 4-7 are "ftyp", 8-11 the brand.
  if (bytes.subarray(4, 8).toString("latin1") === "ftyp") {
    const brand = bytes.subarray(8, 12).toString("latin1");
    if (/qt\s/.test(brand)) return "mov";
    return "mp4"; // covers mp4 + m4v brands
  }
  // WebM/MKV are EBML: 1A 45 DF A3.
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
    return "webm";
  }
  return null;
}

/** Persist an uploaded image under `storage/uploads/<subdir>/<uuid>.<ext>`. */
export async function saveUploadedImage(
  file: File,
  subdir: string,
  maxBytes = MAX_IMAGE_BYTES
): Promise<string> {
  if (!file || file.size === 0) throw new Error("Image file is missing.");
  if (file.size > maxBytes) throw new Error(`Image must be under ${mbLabel(maxBytes)} MB.`);
  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) throw new Error("Only JPG, PNG, WEBP or GIF images are allowed.");
  const dir = path.join(UPLOAD_ROOT, subdir);
  const filename = `${crypto.randomUUID()}.${kind}`;
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), bytes);
  return `${subdir}/${filename}`;
}

/** Persist an uploaded video under `storage/uploads/support-videos/`. */
export async function saveUploadedVideo(file: File): Promise<string> {
  if (!file || file.size === 0) throw new Error("Video file is missing.");
  if (file.size > MAX_VIDEO_BYTES) throw new Error(`Video must be under ${mbLabel(MAX_VIDEO_BYTES)} MB.`);
  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = sniffVideo(bytes);
  if (!kind) throw new Error("Only MP4, WEBM, MOV or M4V videos are allowed.");
  const dir = path.join(UPLOAD_ROOT, "support-videos");
  const filename = `${crypto.randomUUID()}.${kind}`;
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), bytes);
  return `support-videos/${filename}`;
}

/**
 * Best-effort delete of a stored upload.
 *
 * Legacy rows may store "uploads/clinic/x.jpg" — the stale prefix is stripped
 * before the path guard runs.
 */
export function deleteStoredUpload(storedPath: string | null): void {
  const relative = storedPath?.replace(/^uploads\//, "") ?? null;
  if (!relative || !DATE_SAFE.test(relative)) return;
  fs.unlink(path.join(UPLOAD_ROOT, relative)).catch(() => undefined);
}
