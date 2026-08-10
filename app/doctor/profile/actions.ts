"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";
import { verifyPassword, hashPassword } from "@/lib/auth/password";

export type ProfileState = { error: string | null };

export async function updateProfileAction(formData: FormData): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const currentPassword = String(formData.get("current_password") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");

  if (!name) return { error: "Name is required." };

  const updates: Partial<typeof users.$inferInsert> = {
    name,
    phone,
    updatedAt: new Date(),
  };

  // Password change (only when a new password is provided)
  if (newPassword) {
    if (!currentPassword) return { error: "Enter your current password to change it." };
    const [row] = await db
      .select({ password: users.password })
      .from(users)
      .where(eq(users.id, user.id));
    if (!row || !(await verifyPassword(currentPassword, row.password))) {
      return { error: "Current password is incorrect." };
    }
    if (newPassword.length < 8) return { error: "New password must be at least 8 characters." };
    updates.password = await hashPassword(newPassword);
  }

  await db.update(users).set(updates).where(eq(users.id, user.id));
  revalidatePath("/doctor/profile");
  return { error: null };
}
