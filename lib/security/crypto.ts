/**
 * Lightweight secret encryption (AES-256-GCM) for storing sensitive
 * settings like SMTP passwords at rest.
 *
 * The key is derived from AUTH_SECRET so no extra configuration is needed.
 * Values written by this module are prefixed with `skc1:`. Anything else
 * (e.g. legacy Laravel-encrypted or plain values) is returned as-is on
 * decrypt so old rows keep working.
 */

import crypto from "node:crypto";

const ALGO = "aes-256-gcm";
const PREFIX = "skc1:";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function deriveKey(): Buffer {
  const secret = process.env.AUTH_SECRET ?? "skoracare-local-dev";
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, deriveKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptSecret(stored: string | null | undefined): string {
  if (!stored) return "";
  if (!stored.startsWith(PREFIX)) return stored;
  try {
    const raw = Buffer.from(stored.slice(PREFIX.length), "base64");
    if (raw.length < IV_LENGTH + TAG_LENGTH + 1) return "";
    const iv = raw.subarray(0, IV_LENGTH);
    const tag = raw.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const data = raw.subarray(IV_LENGTH + TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGO, deriveKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    return "";
  }
}

/** True when the value was encrypted by this module. */
export function isEncryptedSecret(stored: string | null | undefined): boolean {
  return !!stored && stored.startsWith(PREFIX);
}
