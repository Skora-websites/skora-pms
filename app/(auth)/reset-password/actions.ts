"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { passwordResetTokens, users } from "@/lib/db/schema";
import { revokeAllSessionsForUser } from "@/lib/auth/session";
import { audit } from "@/lib/security/audit-log";

export type ResetState = { error: string | null; ok: boolean };

const RESET_TTL_MS = 60 * 60 * 1000;

const resetSchema = z
  .object({
    email: z.email("Enter a valid email address").trim().toLowerCase(),
    token: z.string().min(10, "Invalid reset link"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be at most 128 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

/** Constant-time hex digest comparison. */
function tokenMatches(plaintext: string, stored: string): boolean {
  const a = Buffer.from(createHash("sha256").update(plaintext).digest("hex"), "utf8");
  const b = Buffer.from(stored, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function resetPassword(
  _prev: ResetState,
  formData: FormData
): Promise<ResetState> {
  const parsed = resetSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    token: String(formData.get("token") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input.", ok: false };
  }
  const { email, token, password } = parsed.data;

  const [row] = await db
    .select({ token: passwordResetTokens.token, createdAt: passwordResetTokens.createdAt })
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.email, email));
  if (
    !row?.token ||
    !row.createdAt ||
    Date.now() - new Date(row.createdAt).getTime() > RESET_TTL_MS ||
    !tokenMatches(token, row.token)
  ) {
    return { error: "This reset link is invalid or has expired. Request a new one.", ok: false };
  }

  const [user] = await db
    .select({ id: users.id, status: users.status })
    .from(users)
    .where(eq(users.email, email));
  if (!user || (user.status && user.status !== "active")) {
    return { error: "This reset link is invalid or has expired. Request a new one.", ok: false };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.update(users).set({ password: passwordHash, updatedAt: new Date() }).where(eq(users.id, user.id));

  // Every existing session dies with the credential change.
  await revokeAllSessionsForUser(user.id);
  // Single-use: the token is spent.
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.email, email));

  await audit.passwordChange(user.id);

  return { error: null, ok: true };
}
