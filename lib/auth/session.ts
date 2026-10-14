import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { randomUUID } from "node:crypto";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { SESSION_MAX_AGE_S, SESSION_IDLE_TIMEOUT_S, SESSION_ACTIVITY_REFRESH_S } from "@/lib/config";

export const SESSION_COOKIE = "skora_session";

/**
 * Session lifetime in seconds — env-driven via lib/config (SESSION_MAX_AGE,
 * default 30 days). Single source of truth: the cookie maxAge and the JWT
 * expiry are both derived from it so they can never drift apart.
 */
export const SESSION_MAX_AGE = SESSION_MAX_AGE_S;

/**
 * Minimum secret length. HS256 signs with the raw key, so anything below this
 * is brute-forceable offline against a captured token.
 */
const MIN_SECRET_LENGTH = 32;

/**
 * Known-weak secrets that must never reach production. Mirrors the placeholder
 * shipped in .env.example so a copy-paste deployment fails loudly instead of
 * signing sessions with a publicly documented value.
 */
const REJECTED_SECRETS = new Set([
  "change-me-to-a-random-64-char-hex-string",
  "change-me",
  "secret",
  "dev-secret",
]);

/**
 * Resolves and validates the JWT signing secret.
 *
 * Throws on absent, short, or placeholder values. A weak secret is as bad as a
 * missing one — an attacker who can forge a session for any user id owns the
 * entire tenant, so validation is a hard failure, never a fallback.
 */
function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("AUTH_SECRET env var is not set");
  }
  if (REJECTED_SECRETS.has(secret)) {
    throw new Error(
      "AUTH_SECRET is still the placeholder value from .env.example. " +
        "Generate a real one with: openssl rand -hex 32"
    );
  }
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`AUTH_SECRET must be at least ${MIN_SECRET_LENGTH} characters`);
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = { userId: number; jti: string };

export async function signSessionToken(userId: number, jti = randomUUID()) {
  return new SignJWT({ userId, jti })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

/**
 * Record a server-side session row so sessions can be revoked (logout-all,
 * password change, admin kick). Capture the client IP and user agent at
 * issuance (audit F-10) — previously the columns were never written, so
 * token-theft attribution was impossible.
 */
export async function persistSession(userId: number, jti: string) {
  const now = Math.floor(Date.now() / 1000);
  let ipAddress: string | null = null;
  let userAgent: string | null = null;
  // Only request-scoped contexts have headers(); calls outside one (scripts,
  // background jobs) still record the session row.
  try {
    const { getClientIp } = await import("@/lib/security/ip");
    ipAddress = await getClientIp();
    const h = await headers();
    userAgent = h.get("user-agent")?.slice(0, 255) ?? null;
  } catch {
    /* no request scope */
  }
  try {
    await db.insert(sessions).values({
      id: jti,
      userId,
      payload: "{}",
      lastActivity: now,
      ipAddress,
      userAgent,
    });
  } catch {
    // Duplicate jti (e.g. re-issued token) — safe to ignore.
  }
}

export async function revokeSession(jti: string) {
  try {
    await db.delete(sessions).where(eq(sessions.id, jti));
  } catch {
    // Non-fatal.
  }
}

export async function revokeAllSessionsForUser(userId: number) {
  try {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  } catch {
    // Non-fatal.
  }
}

/** Revoke every session except the current one (e.g. after a password change). */
export async function revokeOtherSessionsForUser(userId: number, keepJti: string) {
  try {
    await db.delete(sessions).where(and(eq(sessions.userId, userId), ne(sessions.id, keepJti)));
  } catch {
    // Non-fatal.
  }
}

/** Current session's jti (or null when unauthenticated / invalid cookie). */
export async function getCurrentJti(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return typeof payload.jti === "string" ? payload.jti : null;
  } catch {
    return null;
  }
}

/** Reads + verifies the session cookie and returns the userId (or null). */
export async function getSessionUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = typeof payload.userId === "number" ? payload.userId : null;
    if (!userId) return null;

    // Server-side revocation check: if the jti was recorded, it must still exist.
    const jti = typeof payload.jti === "string" ? payload.jti : null;
    if (jti) {
      const [row] = await db
        .select({ id: sessions.id, lastActivity: sessions.lastActivity })
        .from(sessions)
        .where(eq(sessions.id, jti));
      if (!row) return null; // session revoked

      // Idle timeout (audit F-10): a session unused past the window dies on
      // its next use — no idle session rides the full 30-day absolute TTL.
      // last_activity is unix SECONDS (int column).
      const last = Number(row.lastActivity) || 0;
      const nowS = Math.floor(Date.now() / 1000);
      if (SESSION_IDLE_TIMEOUT_S > 0 && last > 0 && nowS - last > SESSION_IDLE_TIMEOUT_S) {
        void revokeSession(jti);
        return null;
      }

      // Throttled activity refresh (audit F-10): last_activity was written
      // once at issuance and never again. Fire-and-forget + fail-open — a
      // transient DB error must never log a live user out.
      if (nowS - last > SESSION_ACTIVITY_REFRESH_S) {
        void db
          .update(sessions)
          .set({ lastActivity: nowS })
          .where(eq(sessions.id, jti))
          .catch(() => undefined);
      }
    }
    return userId;
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: number) {
  const jti = randomUUID();
  const token = await signSessionToken(userId, jti);
  await persistSession(userId, jti);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSecret());
      const jti = typeof payload.jti === "string" ? payload.jti : null;
      if (jti) await revokeSession(jti);
    } catch {
      // Invalid token — just clear the cookie.
    }
  }
  cookieStore.delete(SESSION_COOKIE);
}
