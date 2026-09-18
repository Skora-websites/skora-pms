import { createHash, timingSafeEqual } from "node:crypto";
import { and, eq, isNull, or, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { personalAccessTokens, users } from "@/lib/db/schema";

/**
 * Bearer-token auth for external API consumers (e.g. the Shule app).
 *
 * Mirrors Laravel Sanctum's storage scheme so tokens issued by the legacy
 * backend keep working: the `personal_access_tokens.token` column holds a
 * SHA-256 hash of the plaintext token's value (the part after Sanctum's
 * optional `{id}|` prefix). Plaintext tokens are only ever shown once, at
 * provisioning time (scripts/provision-api-token.mjs).
 */

const USER_MODEL = "App\\Models\\User";

/** Hash a plaintext token exactly the way Sanctum does (SHA-256 of the value after any `{id}|` prefix). */
export function hashApiToken(plaintext: string): string {
  // Strip a Sanctum "{id}|" prefix if present before hashing.
  const bare = plaintext.includes("|") ? plaintext.slice(plaintext.indexOf("|") + 1) : plaintext;
  return createHash("sha256").update(bare).digest("hex");
}

/** Constant-time comparison of two hex digests (avoids timing oracles). */
function hashesMatch(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export type ApiTokenUser = {
  id: number;
  name: string;
  email: string | null;
  role: string;
  status: string | null;
};

function extractBearer(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  const plaintext = match?.[1]?.trim();
  return plaintext || null;
}

/**
 * Resolve the user behind an `Authorization: Bearer <token>` header.
 * Returns null for missing/invalid/expired tokens or deactivated accounts.
 */
export async function getUserByApiTokenHeader(header: string | null): Promise<ApiTokenUser | null> {
  const plaintext = extractBearer(header);
  if (!plaintext) return null;

  const hashed = hashApiToken(plaintext);
  const [token] = await db
    .select({ token: personalAccessTokens.token, tokenableId: personalAccessTokens.tokenableId })
    .from(personalAccessTokens)
    .where(
      and(
        // Unique index makes this a direct hit.
        eq(personalAccessTokens.token, hashed),
        eq(personalAccessTokens.tokenableType, USER_MODEL),
        // Valid while it has no expiry, or the expiry is in the future.
        or(isNull(personalAccessTokens.expiresAt), gt(personalAccessTokens.expiresAt, new Date()))
      )
    )
    .limit(1);
  if (!token) return null;

  // Defense-in-depth: constant-time compare even though the WHERE matched.
  if (!hashesMatch(token.token, hashed)) return null;

  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, status: users.status })
    .from(users)
    .where(eq(users.id, token.tokenableId))
    .limit(1);
  // Deactivated accounts lose API access immediately (same rule as sessions).
  if (!user || (user.status && user.status !== "active")) return null;

  return user;
}

/** Record token usage (mirrors Sanctum's last_used_at bookkeeping). Fire-and-forget. */
export async function touchApiToken(header: string | null): Promise<void> {
  const plaintext = extractBearer(header);
  if (!plaintext) return;
  await db
    .update(personalAccessTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(personalAccessTokens.token, hashApiToken(plaintext)));
}
