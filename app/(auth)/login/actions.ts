"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie, getSessionUserId } from "@/lib/auth/session";
import { homePathForRole } from "@/lib/auth/user";

export type LoginState = { error: string | null };

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Please enter both email and password." };
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
    return { error: "No account found with that email address." };
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    return { error: "Incorrect password. Please try again." };
  }

  if (user.status && user.status !== "active") {
    return { error: "This account has been deactivated. Contact support." };
  }

  // Already logged in? Redirect to the right home instead of double login.
  const existing = await getSessionUserId();
  if (existing) {
    const [me] = await db.select({ role: users.role }).from(users).where(eq(users.id, existing));
    redirect(homePathForRole(me?.role ?? "patient"));
  }

  await setSessionCookie(user.id);
  redirect(homePathForRole(user.role));
}
