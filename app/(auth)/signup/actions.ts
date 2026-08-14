"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { authRateLimit } from "@/lib/security/rate-limit";
import { audit } from "@/lib/security/audit-log";
import { signupSchema } from "@/lib/validation";

export type SignupState = { error: string | null };

export async function signupAction(
  _prev: SignupState,
  formData: FormData
): Promise<SignupState> {
  const rawName = String(formData.get("name") ?? "").trim();
  const rawEmail = String(formData.get("email") ?? "").trim().toLowerCase();
  const rawPhone = String(formData.get("phone") ?? "").trim();
  const gender = String(formData.get("gender") ?? "").trim();
  const rawPassword = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("password_confirmation") ?? "");

  const parsed = signupSchema.safeParse({
    name: rawName,
    email: rawEmail,
    phone: rawPhone || undefined,
    password: rawPassword,
  });
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input.";
    return { error: message };
  }

  if (rawPassword !== confirmation) {
    return { error: "Passwords do not match." };
  }

  const { allowed, retryAfterMs } = authRateLimit.signup(rawEmail);
  if (!allowed) {
    const minutes = Math.ceil(retryAfterMs / 60_000);
    return { error: `Too many signup attempts. Try again in ${minutes} minute(s).` };
  }

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, rawEmail));
  if (existing) {
    return { error: "An account with this email already exists. Try signing in." };
  }

  const hashed = await hashPassword(rawPassword);
  const now = new Date();
  const [result] = await db.insert(users).values({
    name: rawName,
    email: rawEmail,
    phone: rawPhone || null,
    gender: gender || null,
    password: hashed,
    role: "patient",
    status: "active",
    emailVerifiedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  const userId = Number(result.insertId);
  await setSessionCookie(userId);
  await audit.signup(userId, { email: rawEmail, name: rawName });
  redirect("/patient");
}
