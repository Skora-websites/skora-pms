import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import {
  setSessionCookie,
  getSessionUserId,
  destroySession,
} from "@/lib/auth/session";
import { getCurrentUser, getUserPermissions, homePathForRole } from "@/lib/auth/user";
import { authRateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/ip";
import { audit } from "@/lib/security/audit-log";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * POST /api/mobile/session — JSON login for the mobile client.
 *
 * The web login is a server action (`loginAction`) bound to a form: it reads
 * FormData, its success path throws NEXT_REDIRECT instead of returning state,
 * and its action id is a build-generated server reference. A native client
 * cannot hold that contract (research R1/R5), so this route offers the same
 * rules over plain JSON.
 *
 * Every rule below is reproduced from `app/(auth)/login/actions.ts` rather
 * than re-implemented: the single validation schema (`loginSchema`), both
 * rate-limit dimensions, the collapsed credential-failure message, the
 * deactivation message, the stale-session revoke, the same session cookie
 * (issued by `setSessionCookie`, never minted here), the failure-counter
 * reset and the audit log. The only difference is the transport: JSON in,
 * JSON out, and never a redirect.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  // Same coercion as the form path (String(formData.get(..) ?? "")), so a
  // missing or oddly-typed field lands on the schema's own message rather
  // than a crash.
  const raw = (body ?? {}) as Record<string, unknown>;
  const parsed = loginSchema.safeParse({
    email: String(raw.email ?? "").trim().toLowerCase(),
    password: String(raw.password ?? ""),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { email, password } = parsed.data;

  // Two rate-limit dimensions (audit F-07): per-email stops single-source
  // spraying; per-IP stops distributed guessing against one known account.
  // The per-IP check fails open when the IP is unresolvable (no trusted
  // proxy header configured) — a shared "unknown" bucket would let one
  // client lock out every user on the deployment.
  const clientIp = await getClientIp();
  const ipCheck = authRateLimit.loginIp(clientIp);
  if (!ipCheck.allowed) {
    const minutes = Math.ceil(ipCheck.retryAfterMs / 60_000);
    return NextResponse.json(
      { error: `Too many login attempts. Try again in ${minutes} minute(s).` },
      { status: 429 }
    );
  }

  const { allowed, retryAfterMs } = authRateLimit.login(email);
  if (!allowed) {
    const minutes = Math.ceil(retryAfterMs / 60_000);
    return NextResponse.json(
      { error: `Too many login attempts. Try again in ${minutes} minute(s).` },
      { status: 429 }
    );
  }

  const [user] = await db
    .select({
      id: users.id,
      password: users.password,
      role: users.role,
      status: users.status,
      name: users.name,
    })
    .from(users)
    .where(eq(users.email, email));

  if (!user) {
    await audit.loginFailed({ email, reason: "no_account" });
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    await audit.loginFailed({ email, userId: user.id, reason: "bad_password" });
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (user.status && user.status !== "active") {
    await audit.loginFailed({ email, userId: user.id, reason: "deactivated" });
    return NextResponse.json(
      { error: "This account has been deactivated. Contact support." },
      { status: 401 }
    );
  }

  // Stale-session hygiene: the credentials just submitted are authoritative.
  // A leftover session still in the cookie jar must NOT survive into this
  // login — a new login destroys the user's prior session (single active
  // session), exactly as `loginAction` behaves. (Only reached after
  // successful verification, so a failed attempt never destroys an active
  // session.)
  const existing = await getSessionUserId();
  if (existing) await destroySession();

  await setSessionCookie(user.id);
  // Successful login clears the failure counters — a legitimate user who
  // logs in/out several times in a row must not hit "too many attempts".
  authRateLimit.loginReset(email);
  authRateLimit.loginIpReset(clientIp);
  await audit.login(user.id, { email, role: user.role });

  // The service decides where a role lands; the app never parses this path
  // for anything but the initial navigation.
  return NextResponse.json({
    user: { id: user.id, name: user.name, role: user.role },
    home: homePathForRole(user.role),
  });
}

/**
 * GET /api/mobile/session — who am I.
 *
 * Resolves the same identity the server-rendered pages use (`getCurrentUser`,
 * React `cache()`d per request), so the app resolves role, linked doctor id
 * and duty state from one place instead of caching them from login. A no
 * session, a revoked `sessions` row and a passed idle timeout all collapse
 * to null inside `getSessionUserId` — hence 401 for all three.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const permissions = await getUserPermissions(user.id);

  return NextResponse.json({
    user,
    permissions: Array.from(permissions),
  });
}

/**
 * DELETE /api/mobile/session — sign-out. Idempotent: an absent or already
 * revoked session is not an error, it just clears the cookie.
 */
export async function DELETE() {
  await destroySession();
  return NextResponse.json({ error: null });
}
