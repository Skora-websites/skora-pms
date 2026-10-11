"use server";

import crypto from "node:crypto";
import { and, eq, gt, lt, or } from "drizzle-orm";
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

  // Side-channel housekeeping (audit F-18): consumed/expired rows hold no
  // reusable secret, so they can go. Throttled so the common resend path
  // does not pay a delete on every call.
  void maybePurgeStaleOtps();

  const otp = String(crypto.randomInt(100000, 1000000));
  const expiresAt = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000);
  await db.insert(registrationOtps).values({
    email,
    otp,
    expiresAt,
    used: false,
  });

  // No SMS gateway is configured, so verification is email-based. The OTP is
  // only echoed back with an EXPLICIT opt-in flag (audit F-15: the old
  // NODE_ENV probe echoed the OTP whenever NODE_ENV was unset — one
  // misconfigured deployment away from a meaningless verification gate);
  // refused outright in production.
  void sendMail({
    to: email,
    subject: "Your SkoraCares signup OTP",
    text: `Your OTP is ${otp}. It is valid for ${OTP_TTL_MIN} minutes.`,
  }).catch(() => undefined);

  const exposeDevOtp =
    process.env.EXPOSE_DEV_OTP === "true" && process.env.NODE_ENV !== "production";
  return { error: null, sent: true, ...(exposeDevOtp ? { devOtp: otp } : {}) };
}

/** Verify an OTP for an email. Returns true when valid and marks it used. */
export async function verifySignupOtp(email: string, otp: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();

  // This action is exported (callable directly by an unauthenticated client)
  // and guards a security decision, so failed attempts must be throttled
  // here — not only in signupAction. 10 guesses per 10-minute OTP window
  // keeps brute-forcing the 6-digit code impractical.
  const { allowed } = authRateLimit.otpVerify(normalized);
  if (!allowed) return false;

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
  // Destroy the value on consumption (audit F-18): used=true alone left the
  // plaintext code standing forever — a 6-digit secret readable by anyone
  // with database access. The row is still browsable for rate-limit bookkeeping
  // (lookups match on used=false, so clearing the value cannot affect them).
  await db
    .update(registrationOtps)
    .set({ used: true, otp: "" })
    .where(eq(registrationOtps.id, row.id));
  return true;
}

/**
 * Purge consumed and expired OTP rows (audit F-18). Called opportunistically
 * from the OTP send path — no queue worker exists in this codebase (see
 * architecture notes), so the purge rides an existing write entry point and
 * runs at most once per hour per process. Bounded delete, fire-safe on errors.
 */
let lastOtpPurge = 0;
function maybePurgeStaleOtps(): void {
  if (Date.now() - lastOtpPurge < 60 * 60_000) return;
  lastOtpPurge = Date.now();
  void purgeStaleOtps();
}

async function purgeStaleOtps(): Promise<void> {
  try {
    await db
      .delete(registrationOtps)
      .where(
        or(
          eq(registrationOtps.used, true),
          lt(registrationOtps.expiresAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
        )
      );
  } catch {
    // Non-fatal: the next send re-tries.
  }
}
