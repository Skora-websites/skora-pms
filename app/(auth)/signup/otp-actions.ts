"use server";

import crypto from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { registrationOtps } from "@/lib/db/schema";
import { authRateLimit } from "@/lib/security/rate-limit";
import { sendMail } from "@/lib/mail/send";

export type OtpState = { error: string | null; sent?: boolean; devOtp?: string };

const OTP_TTL_MIN = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Generate a 6-digit OTP for an email address (used at signup). */
export async function sendSignupOtp(
  _prev: OtpState,
  formData: FormData
): Promise<OtpState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!EMAIL_RE.test(email)) {
    return { error: "Enter a valid email address first." };
  }

  const { allowed, retryAfterMs } = authRateLimit.signup(`otp:${email}`);
  if (!allowed) {
    const minutes = Math.ceil(retryAfterMs / 60_000);
    return { error: `Too many OTP requests. Try again in ${minutes} minute(s).` };
  }

  // Invalidate previous unused OTPs for this email.
  await db.update(registrationOtps).set({ used: true }).where(eq(registrationOtps.email, email));

  const otp = String(crypto.randomInt(100000, 1000000));
  const expiresAt = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000);
  await db.insert(registrationOtps).values({
    email,
    otp,
    expiresAt,
    used: false,
  });

  // No SMS gateway is configured, so verification is email-based. The OTP is
  // only echoed back to the client in non-production environments — never
  // return it in production or the verification gate is meaningless.
  void sendMail({
    to: email,
    subject: "Your SkoraCares signup OTP",
    text: `Your OTP is ${otp}. It is valid for ${OTP_TTL_MIN} minutes.`,
  }).catch(() => undefined);

  const isDev = process.env.NODE_ENV !== "production";
  return { error: null, sent: true, ...(isDev ? { devOtp: otp } : {}) };
}

/** Verify an OTP for an email. Returns true when valid and marks it used. */
export async function verifySignupOtp(email: string, otp: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const [row] = await db
    .select({ id: registrationOtps.id })
    .from(registrationOtps)
    .where(
      and(
        eq(registrationOtps.email, normalized),
        eq(registrationOtps.otp, String(otp).trim()),
        eq(registrationOtps.used, false),
        gt(registrationOtps.expiresAt, new Date()) // still valid
      )
    )
    .limit(1);

  if (!row) return false;
  await db.update(registrationOtps).set({ used: true }).where(eq(registrationOtps.id, row.id));
  return true;
}
