import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { authRateLimit } from "@/lib/security/rate-limit";
import { audit } from "@/lib/security/audit-log";
import { getClientIp } from "@/lib/security/ip";
import { SESSION_MAX_AGE_S } from "@/lib/config";
import { persistSession, signSessionToken } from "@/lib/auth/session";

export const runtime = "nodejs";

/**
 * POST /api/mobile/login
 *
 * Native sign-in for the Flutter client.
 *
 * The web app authenticates with an HttpOnly cookie, which a native client
 * cannot present transparently, so this route returns the same signed session
 * token in the response body. The client replays it as `Cookie: session=…` on
 * every subsequent request — the identical credential the browser sends, so all
 * existing guards (`getCurrentUser`, `requireApiRole`) work unchanged.
 *
 * Body: { email, password }
 */
export async function POST(request: Request) {
  const clientIp = await getClientIp();
  const { allowed } = authRateLimit.loginIp(clientIp);
  if (!allowed) {
    return NextResponse.json({ error: "Too many login attempts." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const { allowed: emailAllowed } = authRateLimit.login(email);
  if (!emailAllowed) {
    return NextResponse.json({ error: "Too many login attempts." }, { status: 429 });
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      password: users.password,
      role: users.role,
      status: users.status,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Same error for unknown email and bad password — no account enumeration.
  if (!user || !(await verifyPassword(password, user.password))) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }
  if (user.status && user.status !== "active") {
    return NextResponse.json({ error: "This account is not active." }, { status: 403 });
  }

  const jti = randomUUID();
  const token = await signSessionToken(user.id, jti);
  await persistSession(user.id, jti);
  void audit.login(user.id, { email: user.email, role: user.role, source: "mobile" });

  return NextResponse.json({
    sessionToken: token,
    maxAgeSeconds: SESSION_MAX_AGE_S,
    user: { id: user.id, email: user.email, role: user.role },
  });
}
