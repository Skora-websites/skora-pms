"use server";

import { revalidatePath } from "next/cache";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getCurrentUser, hasPermission } from "@/lib/auth/user";
import { verifyPassword, hashPassword } from "@/lib/auth/password";

export type ProfileState = { error: string | null };

// Stored outside public/ — served via the authenticated photo route.
const PHOTO_DIR = path.join(process.cwd(), "storage", "uploads", "profile-photos");
const SIGNATURE_DIR = path.join(process.cwd(), "storage", "uploads", "signatures");

/** Sniff image type from magic bytes: JPEG (FFD8FF) or PNG (89PNG). */
function sniffImage(bytes: Buffer): "jpg" | "png" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "png";
  }
  return null;
}

export async function uploadProfilePhoto(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) return { error: "Please choose an image." };
  if (file.size > 2 * 1024 * 1024) return { error: "Image must be under 2 MB." };

  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) return { error: "Only JPG or PNG images are allowed." };

  const filename = `${user.id}-${crypto.randomUUID()}.${kind}`;
  try {
    await fs.mkdir(PHOTO_DIR, { recursive: true });
    await fs.writeFile(path.join(PHOTO_DIR, filename), bytes);
  } catch (err) {
    console.error("Failed to store profile photo:", err);
    return { error: "Could not save the image. Please try again." };
  }

  const storedPath = `profile-photos/${filename}`;
  const [row] = await db
    .select({ profilePhotoPath: users.profilePhotoPath })
    .from(users)
    .where(eq(users.id, user.id));
  const oldPath = row?.profilePhotoPath;

  await db
    .update(users)
    .set({ profilePhotoPath: storedPath, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  // Best-effort cleanup of the previous photo.
  if (oldPath) {
    fs.unlink(path.join(process.cwd(), "storage", "uploads", oldPath)).catch(() => undefined);
  }

  revalidatePath("/doctor/profile");
  return { error: null };
}

export async function uploadSignature(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  const file = formData.get("signature") as File | null;
  if (!file || file.size === 0) return { error: "Please choose an image." };
  if (file.size > 2 * 1024 * 1024) return { error: "Image must be under 2 MB." };

  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) return { error: "Only JPG or PNG images are allowed." };

  const filename = `${user.id}-${crypto.randomUUID()}.${kind}`;
  try {
    await fs.mkdir(SIGNATURE_DIR, { recursive: true });
    await fs.writeFile(path.join(SIGNATURE_DIR, filename), bytes);
  } catch (err) {
    console.error("Failed to store signature:", err);
    return { error: "Could not save the image. Please try again." };
  }

  const storedPath = `signatures/${filename}`;
  const [row] = await db
    .select({ signaturePath: users.signaturePath })
    .from(users)
    .where(eq(users.id, user.id));
  const oldPath = row?.signaturePath;

  await db
    .update(users)
    .set({ signaturePath: storedPath, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  if (oldPath) {
    fs.unlink(path.join(process.cwd(), "storage", "uploads", oldPath)).catch(() => undefined);
  }

  revalidatePath("/doctor/profile");
  return { error: null };
}

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
