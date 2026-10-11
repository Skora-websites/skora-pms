"use server";

import crypto from "node:crypto";
import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { passwordResetTokens, users } from "@/lib/db/schema";
import { rateLimit } from "@/lib/security/rate-limit";
import { audit } from "@/lib/security/audit-log";
import { sendMail } from "@/lib/mail/send";
import { APP_URL } from "@/lib/config";

export type ForgotState = { error: string | null; sent: boolean };

/**
 * Self-service password reset (audit G-01): the `password_reset_tokens`
 * table existed in the schema but was referenced nowhere — a user who lost
 * their password had no recovery path. Token lifecycle mirrors the OTP flow:
 * hashed at rest, single-use, 60-minute TTL, rate-limited per email.
 */
const RESET_TTL_MS = 60 * 60 * 1000;

const requestSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),
});

/** Generic response for every path — never reveal whether the account exists. */
const GENERIC_OK =
  "If an account exists for that email, a password-reset link has been sent. It expires in 60 minutes.";

export async function requestPasswordReset(
  _prev: ForgotState,
  formData: FormData
): Promise<ForgotState> {
  const parsed = requestSchema.safeParse({
    email: String(formData.get("email") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid email.", sent: false };
  }
  const { email } = parsed.data;

  const { allowed, retryAfterMs } = rateLimit(`pwreset:${email}`, 3, 60 * 60_000);
  if (!allowed) {
    const minutes = Math.ceil(retryAfterMs / 60_000);
    return { error: `Too many reset requests. Try again in ${minutes} minute(s).`, sent: false };
  }

  const [user] = await db
    .select({ id: users.id, name: users.name, status: users.status })
    .from(users)
    .where(eq(users.email, email));

  if (user && (!user.status || user.status === "active")) {
    const plaintext = crypto.randomBytes(32).toString("hex");
    const hashed = createHash("sha256").update(plaintext).digest("hex");

    // One live token per email (the PK upserts) — a fresh request
    // invalidates any earlier link, like the signup-OTP flow.
    await db
      .insert(passwordResetTokens)
      .values({ email, token: hashed, createdAt: new Date() })
      .onDuplicateKeyUpdate({ set: { token: hashed, createdAt: new Date() } });

    const link = `${APP_URL}/reset-password?email=${encodeURIComponent(email)}&token=${plaintext}`;
    void sendMail({
      to: email,
      subject: "Reset your SkoraCares password",
      text:
        `Hi ${user.name ?? "there"},\n\n` +
        `Someone requested a password reset for your SkoraCares account.\n` +
        `Open this link to choose a new password (valid for 60 minutes):\n\n${link}\n\n` +
        `If you didn't request this, ignore this email — your password stays unchanged.`,
    }).catch(() => undefined);

    await audit.settingsUpdated(user.id, { action: "password_reset_requested" });
  }

  return { error: null, sent: true };
}
