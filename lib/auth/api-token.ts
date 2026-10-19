import { createHash, timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull, or } from "drizzle-orm";
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
 * Outcome of presenting a bearer token.
 *
 * `authenticated` — a live token for an active account (the holder follows).
 * `deactivated`   — the token itself is valid but its owner account is gone
 *                   or deactivated: a refusal (403), NOT an authentication
 *                   failure (401).
 * `unauthenticated` — no token, a malformed header, an unknown/expired token,
 *                   or a hash mismatch: 401.
 *
 * The endpoint's docstring has always promised this split; collapsing both
 * failure modes into `null` made every refusal a 401 (audit FR-018).
 */
export type ApiTokenResolution =
  | { kind: "authenticated"; user: ApiTokenUser }
  | { kind: "deactivated" }
  | { kind: "unauthenticated" };

/**
 * Resolve the account behind an `Authorization: Bearer <token>` header.
 * Never throws for a bad token — the outcome distinguishes the failure modes.
 */
export async function resolveApiTokenHeader(header: string | null): Promise<ApiTokenResolution> {
  const plaintext = extractBearer(header);
  if (!plaintext) return { kind: "unauthenticated" };

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
  if (!token) return { kind: "unauthenticated" };

  // Defense-in-depth: constant-time compare even though the WHERE matched.
  if (!hashesMatch(token.token, hashed)) return { kind: "unauthenticated" };

  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, status: users.status })
    .from(users)
    .where(eq(users.id, token.tokenableId))
    .limit(1);
  // Deactivated accounts lose API access immediately (same rule as sessions).
  // A missing row is the same case: the account behind a valid token is gone.
  if (!user || (user.status && user.status !== "active")) return { kind: "deactivated" };

  return { kind: "authenticated", user };
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

/**
 * Tiers allowed to read the clinic directory at all.
 *
 * Tokens are per-user, so the holder's ROLE is the first tenancy gate: a
 * patient token qualifies as far as authentication is concerned but must not
 * enumerate practitioners — names, emails, phones and registration numbers
 * included (audit H4 / FR-017).
 */
export const API_STAFF_TIERS: readonly string[] = ["admin", "manager", "doctor"];

/**
 * Doctor ids an integration caller may see, derived from the holder's own
 * scope, lives in `./integration-scope` (it imports `lib/queries/clinic`, and
 * the token-auth module stays free of tenancy queries).
 */

