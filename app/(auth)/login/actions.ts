"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie, getSessionUserId, destroySession } from "@/lib/auth/session";
import { getCurrentUser, getUserPermissions, homePathForRole } from "@/lib/auth/user";
import { doctorPathToReceptionist, firstPermittedDoctorPath } from "@/lib/auth/permissions";
import { authRateLimit } from "@/lib/security/rate-limit";
import { audit } from "@/lib/security/audit-log";
import { loginSchema } from "@/lib/validation";

export type LoginState = { error: string | null };

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input.";
    return { error: message };
  }

  const { email, password } = parsed.data;

  const { allowed, retryAfterMs } = authRateLimit.login(email);
  if (!allowed) {
    const minutes = Math.ceil(retryAfterMs / 60_000);
    return { error: `Too many login attempts. Try again in ${minutes} minute(s).` };
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
    .where(eq(users.email, email));

  if (!user) {
    await audit.loginFailed({ email, reason: "no_account" });
    return { error: "Invalid email or password." };
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    await audit.loginFailed({ email, userId: user.id, reason: "bad_password" });
    return { error: "Invalid email or password." };
  }

  if (user.status && user.status !== "active") {
    await audit.loginFailed({ email, userId: user.id, reason: "deactivated" });
    return { error: "This account has been deactivated. Contact support." };
  }

  // Stale-session hygiene: the credentials just submitted are authoritative.
  // A leftover session still in the cookie jar (e.g. the business-owner or
  // receptionist account from a previous login) must NOT decide where this
  // login lands — it used to: submitting doctor credentials while an owner
  // session was active bounced the doctor to /admin (or a receptionist
  // session sent them to /receptionist). Revoke whatever session exists,
  // then issue a fresh one; the redirects below are derived purely from the
  // account that was just authenticated. (Only reached after successful
  // verification, so a failed attempt never destroys an active session.)
  const existing = await getSessionUserId();
  if (existing) await destroySession();

  await setSessionCookie(user.id);
  // Successful login clears the failure counter — a legitimate user who
  // logs in/out several times in a row must not hit "too many attempts".
  authRateLimit.loginReset(email);
  await audit.login(user.id, { email, role: user.role });

  // Doctor-side users land on their first PERMITTED page directly. Landing on
  // ROLE_HOME (/doctor) first makes the doctor layout redirect() during the
  // action's client-side RSC render, and in Next 16 that redirect-in-layout
  // during a server-action navigation never settles — the router re-fetches
  // the destination forever and the page stays blank. One hop avoids it.
  if (user.role === "doctor" || user.role === "receptionist") {
    const me = await getCurrentUser();
    const perms = me ? await getUserPermissions(user.id) : new Set<string>();
    const target = firstPermittedDoctorPath(perms);
    redirect(user.role === "receptionist" ? doctorPathToReceptionist(target) : target);
  }
  // Admin tier: land on /admin directly — ROLE_HOME would bounce through the
  // layout guard (same Next 16 redirect-in-layout hazard as above).
  if (user.role === "admin" || user.role === "manager") {
    redirect("/admin");
  }
  redirect(homePathForRole(user.role));
}
