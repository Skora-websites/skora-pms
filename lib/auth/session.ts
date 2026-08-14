import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";

export const SESSION_COOKIE = "skora_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET env var is not set");
  return new TextEncoder().encode(secret);
}

export type SessionPayload = { userId: number; jti: string };

export async function signSessionToken(userId: number, jti = randomUUID()) {
  return new SignJWT({ userId, jti })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

/**
 * Record a server-side session row so sessions can be revoked (logout-all,
 * password change, admin kick).
 */
export async function persistSession(userId: number, jti: string) {
  const now = Math.floor(Date.now() / 1000);
  try {
    await db.insert(sessions).values({
      id: jti,
      userId,
      payload: "{}",
      lastActivity: now,
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
        .select({ id: sessions.id })
        .from(sessions)
        .where(eq(sessions.id, jti));
      if (!row) return null; // session revoked
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
