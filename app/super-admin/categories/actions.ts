"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/user";
import { db } from "@/lib/db";
import { and, eq, ne } from "drizzle-orm";
import { categories, blogs } from "@/lib/db/schema";
import { MAX_IMAGE_BYTES } from "@/lib/config";

import { audit } from "@/lib/security/audit-log";

import { slugify } from "@/lib/utils";

/** Shared super-admin guard + result type (previously in the one big actions.ts). */
export type AdminActionResult = { error: string | null };

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "super_admin") redirect("/login");
  return user;
}

// ── Categories (legacy `CategoryController` parity) ─────────────────────────

export async function storeCategory(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Category name is required." };
  if (name.length > 255) return { error: "Category name must be at most 255 characters." };

  const slug = slugify(name) || "category";
  const [dup] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug));
  if (dup) return { error: "A category with this name already exists." };

  const [created] = await db
    .insert(categories)
    .values({ name, slug, createdAt: new Date(), updatedAt: new Date() })
    .$returningId();

  void audit.categoryCreated(admin.id, { action: "category_created", categoryId: Number(created.id), name });

  revalidatePath("/super-admin/blogs");
  return { error: null };
}

export async function updateCategory(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const categoryId = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!Number.isInteger(categoryId)) return { error: "Invalid category ID." };
  if (!name) return { error: "Category name is required." };

  const [existing] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, categoryId));
  if (!existing) return { error: "Category not found." };

  const slug = slugify(name) || "category";
  const [dup] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.slug, slug), ne(categories.id, categoryId)));
  if (dup) return { error: "A category with this name already exists." };

  await db.update(categories).set({ name, slug, updatedAt: new Date() }).where(eq(categories.id, categoryId));

  void audit.categoryUpdated(admin.id, { action: "category_updated", categoryId, name });

  revalidatePath("/super-admin/blogs");
  return { error: null };
}

export async function deleteCategory(categoryId: number): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!Number.isInteger(categoryId)) return { error: "Invalid category ID." };

  const [existing] = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, categoryId));
  if (!existing) return { error: "Category not found." };

  const [used] = await db
    .select({ id: blogs.id })
    .from(blogs)
    .where(eq(blogs.categoryId, categoryId))
    .limit(1);
  if (used) return { error: "Cannot delete a category that has blogs. Move or delete its blogs first." };

  await db.delete(categories).where(eq(categories.id, categoryId));

  void audit.categoryDeleted(admin.id, { action: "category_deleted", categoryId });

  revalidatePath("/super-admin/blogs");
  return { error: null };
}
