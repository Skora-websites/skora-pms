"use server";

import { redirect } from "next/navigation";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, companySettings, roles, modelHasRoles, permissions, modelHasPermissions } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { DEFAULT_DOCTOR_MODULE_PERMS } from "@/lib/auth/server-permissions";
import { isDupKey } from "@/lib/db/dup";
import { authRateLimit } from "@/lib/security/rate-limit";
import { audit } from "@/lib/security/audit-log";
import { signupSchema } from "@/lib/validation";
import { verifySignupOtp } from "./otp-actions";

export type SignupState = { error: string | null };

const USER_MODEL = "App\\Models\\User";

/** User + role attach + permission grants in one transaction — a crash between them would strand a doctor with no dashboard access. */
async function createUser(input: {
  name: string;
  email: string;
  phone: string | null;
  gender: string | null;
  passwordHash: string;
  role: string;
  trialEndsAt: Date | null;
}): Promise<number> {
  const now = new Date();
  return db.transaction(async (tx) => {
    const [result] = await tx.insert(users).values({
      name: input.name,
      email: input.email,
      phone: input.phone,
      gender: input.gender,
      password: input.passwordHash,
      role: input.role as never,
      status: "active",
      emailVerifiedAt: now,
      trialEndsAt: input.trialEndsAt,
      createdAt: now,
      updatedAt: now,
    });
    const newUserId = Number(result.insertId);

    if (input.role === "doctor") {
      // Legacy Doctor role carried zero permissions and every new doctor was
      // locked out of the dashboard. Grant the default module set + system role.
      const [systemRole] = await tx
        .select({ id: roles.id })
        .from(roles)
        .where(and(eq(roles.name, "Doctor"), isNull(roles.doctorId)));
      if (systemRole) {
        await tx.insert(modelHasRoles).values({ roleId: systemRole.id, modelId: newUserId, modelType: USER_MODEL });
      }

      const permRows = await tx
        .select({ id: permissions.id })
        .from(permissions)
        .where(inArray(permissions.name, DEFAULT_DOCTOR_MODULE_PERMS));
      if (permRows.length > 0) {
        await tx.insert(modelHasPermissions).values(
          permRows.map((p) => ({ permissionId: p.id, modelType: USER_MODEL, modelId: newUserId }))
        );
      }
    }
    return newUserId;
  });
}

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

  let userId: number;
  try {
    userId = await createUser({
      name: rawName,
      email: rawEmail,
      phone: rawPhone || null,
      gender: gender || null,
      passwordHash: hashed,
      role,
      trialEndsAt,
    });
  } catch (err) {
    // Concurrent signup with the same email won the unique-key race.
    if (isDupKey(err)) {
      return { error: "An account with this email already exists. Try signing in." };
    }
    throw err;
  }

  await setSessionCookie(userId);
  await audit.signup(userId, { email: rawEmail, name: rawName, role, phone: rawPhone, trialEndsAt: trialEndsAt?.toISOString() ?? null });
  redirect(role === "doctor" ? "/doctor" : "/patient");
}
