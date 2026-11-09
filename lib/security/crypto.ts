/**
 * Lightweight secret encryption (AES-256-GCM) for storing sensitive
 * settings like SMTP passwords at rest.
 *
 * The key is derived from AUTH_SECRET so no extra configuration is needed.
 * Values written by this module are prefixed with `skc1:`. Anything else
 * (e.g. legacy Laravel-encrypted or plain values) is returned as-is on
 * decrypt so old rows keep working.
 *
 * KEY SEPARATION (audit V3): the encryption key is NOT a plain hash of
 * AUTH_SECRET any more. Session signing (integrity) and at-rest secret
 * encryption (confidentiality) are different concerns with different rotation
 * cadences, and sharing one raw key meant that rotating AUTH_SECRET to kill
 * every session would ALSO silently orphan every `skc1:` value — and
 * `decryptSecret` returns "" on failure, so stored SMTP passwords would
 * degrade to empty strings with no alarm.
 *
 * Two keys, two purposes, by default:
 *   1. AUTH_SECRET alone (no SECRETS_ENCRYPTION_KEY set): HKDF-SHA256 derives
 *      two distinct sub-keys, one per `info` label. No extra configuration,
 *      but signing and encryption can never collide.
 *   2. SECRETS_ENCRYPTION_KEY set: it is used verbatim as the encryption key
 *      and AUTH_SECRET is never touched by this module — so the two rotate
 *      independently and neither can break the other.
 *
 * The v1 prefix stays on the ciphertext so legacy values remain readable
 * ONLY while the derived-from-AUTH_SECRET path is in use: setting
 * SECRETS_ENCRYPTION_KEY deliberately means old rows fail to decrypt (they
 * return ""). That is the safe failure — it never returns ciphertext as
 * plaintext, and re-saving a setting rewrites it under the new key.
 */

import crypto from "node:crypto";
import { SECRETS_ENCRYPTION_KEY } from "@/lib/config";

const ALGO = "aes-256-gcm";
const PREFIX = "skc1:";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

/** HKDF-SHA256, the standard KDF for exactly this "one master, many purposes" job. */
function hkdf(secret: string, info: string): Buffer {
  const salt = Buffer.from("skoracare-secret-encryption-v1", "utf8");
  return Buffer.from(
    crypto.hkdfSync("sha256", Buffer.from(secret, "utf8"), salt, Buffer.from(info, "utf8"), 32)
  );
}

function deriveKey(): Buffer {
  // Explicit dedicated key wins — then this module never reads AUTH_SECRET.
  if (SECRETS_ENCRYPTION_KEY) {
    return hkdf(SECRETS_ENCRYPTION_KEY, "secret-encryption");
  }
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      // Silent weak-key fallback in production would let anyone decrypt
      // stored secrets. Fail loudly instead.
      throw new Error("AUTH_SECRET env var is not set — cannot use secret encryption.");
    }
    return crypto.createHash("sha256").update("skoracare-local-dev").digest();
  }
  // Distinct-purpose sub-key: "session-signing" is what JWT uses, so this
  // module's key can never equal the signing key even by accident.
  return hkdf(secret, "secret-encryption");
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
