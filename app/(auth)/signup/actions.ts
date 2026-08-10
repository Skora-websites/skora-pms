"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";

export type SignupState = { error: string | null };

export async function signupAction(
  _prev: SignupState,
  formData: FormData
): Promise<SignupState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const gender = String(formData.get("gender") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("password_confirmation") ?? "");

  if (!name || !email || !password) {
    return { error: "Please fill in your name, email and password." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }
  if (password !== confirmation) {
    return { error: "Passwords do not match." };
  }

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing) {
    return { error: "An account with this email already exists. Try signing in." };
  }

  const hashed = await hashPassword(password);
  const now = new Date();
  const [result] = await db.insert(users).values({
    name,
    email,
    phone: phone || null,
    gender: gender || null,
    password: hashed,
    role: "patient",
    status: "active",
    emailVerifiedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  await setSessionCookie(Number(result.insertId));
  redirect("/patient");
}
