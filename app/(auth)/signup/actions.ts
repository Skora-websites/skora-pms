"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, companySettings } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { authRateLimit } from "@/lib/security/rate-limit";
import { audit } from "@/lib/security/audit-log";
import { signupSchema } from "@/lib/validation";
import { verifySignupOtp } from "./otp-actions";

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
  const role = String(formData.get("role") ?? "patient").trim();
  const otp = String(formData.get("otp") ?? "").trim();

  if (!["patient", "doctor"].includes(role)) {
    return { error: "Invalid account type." };
  }

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

  // OTP verification is required for signup.
  if (!rawPhone) return { error: "Phone number is required for OTP verification." };
  if (!otp) return { error: "Please enter the OTP sent to your phone." };
  const otpOk = await verifySignupOtp(rawPhone, otp);
  if (!otpOk) return { error: "Invalid or expired OTP. Please request a new one." };

  const { allowed, retryAfterMs } = authRateLimit.signup(rawEmail);
  if (!allowed) {
    const minutes = Math.ceil(retryAfterMs / 60_000);
    return { error: `Too many signup attempts. Try again in ${minutes} minute(s).` };
  }

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, rawEmail));
  if (existing) {
    return { error: "An account with this email already exists. Try signing in." };
  }

  // Doctor accounts get a trial window (legacy RegistrationController parity).
  let trialEndsAt: Date | null = null;
  if (role === "doctor") {
    const [setting] = await db
      .select({ defaultTrialDays: companySettings.defaultTrialDays })
      .from(companySettings)
      .limit(1);
    const days = setting?.defaultTrialDays ?? 15;
    trialEndsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  const hashed = await hashPassword(rawPassword);
  const now = new Date();
  const [result] = await db.insert(users).values({
    name: rawName,
    email: rawEmail,
    phone: rawPhone || null,
    gender: gender || null,
    password: hashed,
    role: role as never,
    status: "active",
    emailVerifiedAt: now,
    trialEndsAt,
    createdAt: now,
    updatedAt: now,
  });

  const userId = Number(result.insertId);
  await setSessionCookie(userId);
  await audit.signup(userId, { email: rawEmail, name: rawName, role, phone: rawPhone, trialEndsAt: trialEndsAt?.toISOString() ?? null });
  redirect(role === "doctor" ? "/doctor" : "/patient");
}
