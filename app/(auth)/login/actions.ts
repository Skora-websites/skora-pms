"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie, getSessionUserId, destroySession } from "@/lib/auth/session";
import { homePathForRole } from "@/lib/auth/user";
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
    return { error: "No account found with that email address." };
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    await audit.loginFailed({ email, userId: user.id, reason: "bad_password" });
    return { error: "Incorrect password. Please try again." };
  }

  if (user.status && user.status !== "active") {
    await audit.loginFailed({ email, userId: user.id, reason: "deactivated" });
    return { error: "This account has been deactivated. Contact support." };
  }

  // Already logged in? Redirect to the right home instead of double login.
  // If the existing session belongs to a deactivated account, clear it and
  // let the login attempt proceed (it will be rejected below).
  const existing = await getSessionUserId();
  if (existing) {
    const [me] = await db.select({ role: users.role, status: users.status }).from(users).where(eq(users.id, existing));
    if (me?.status === "active") {
      redirect(homePathForRole(me.role ?? "patient"));
    }
    await destroySession();
  }

  await setSessionCookie(user.id);
  await audit.login(user.id, { email, role: user.role });
  redirect(homePathForRole(user.role));
}
