"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/user";
import { db } from "@/lib/db";
import { and, eq, ne } from "drizzle-orm";
import { categories, blogs, blogImages } from "@/lib/db/schema";

import { audit } from "@/lib/security/audit-log";

import { slugify } from "@/lib/utils";
import { saveUploadedImage, deleteStoredUpload } from "@/lib/uploads/media";

/** Shared super-admin guard + result type (previously in the one big actions.ts). */
export type AdminActionResult = { error: string | null };

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "super_admin") redirect("/login");
  return user;
}

// ── Blogs (legacy `BlogController` parity) ──────────────────────────────────

async function uniqueSlug(base: string, ignoreId?: number): Promise<string> {
  const candidate = slugify(base) || "blog";
  let slug = candidate;
  let n = 2;
  for (;;) {
    const [dup] = await db
      .select({ id: blogs.id })
      .from(blogs)
      .where(and(eq(blogs.slug, slug), ignoreId ? ne(blogs.id, ignoreId) : undefined));
    if (!dup) return slug;
    slug = `${candidate}-${n++}`;
  }
}

export async function storeBlog(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const categoryIdRaw = Number(formData.get("category_id"));
  const shortcontent = String(formData.get("shortcontent") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const status = formData.get("status") === "1" || formData.get("status") === "on";
  const publishAtRaw = String(formData.get("publish_at") ?? "").trim();

  if (!title) return { error: "Title is required." };
  if (title.length > 255) return { error: "Title must be at most 255 characters." };
  if (!shortcontent) return { error: "A short summary is required." };
  if (!content) return { error: "Content is required." };

  let publishAt: Date | null = null;
  if (publishAtRaw) {
    const parsed = new Date(publishAtRaw);
    if (Number.isNaN(parsed.getTime())) return { error: "Invalid publish date." };
    publishAt = parsed;
  }

  let categoryId: number | null = null;
  if (Number.isInteger(categoryIdRaw) && categoryIdRaw > 0) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, categoryIdRaw));
    if (!cat) return { error: "Select a valid category." };
    categoryId = categoryIdRaw;
  } else {
    return { error: "A category is required." };
  }

  let imagePath: string | null = null;
  const image = formData.get("image") as File | null;
  if (image && image.size > 0) {
    try {
      imagePath = await saveUploadedImage(image, "blogs");
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Could not save the image." };
    }
  }

  const slug = await uniqueSlug(title);
  const [created] = await db
    .insert(blogs)
    .values({
      categoryId,
      title,
      slug,
      shortcontent,
      content,
      image: imagePath,
      status,
      publishAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .$returningId();

  void audit.categoryCreated(admin.id, { action: "blog_created", blogId: Number(created.id), title });

  revalidatePath("/super-admin/blogs");
  return { error: null };
}

export async function updateBlog(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const blogId = Number(formData.get("id"));
  if (!Number.isInteger(blogId)) return { error: "Invalid blog ID." };
  const title = String(formData.get("title") ?? "").trim();
  const categoryIdRaw = Number(formData.get("category_id"));
  const shortcontent = String(formData.get("shortcontent") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const status = formData.get("status") === "1" || formData.get("status") === "on";
  const publishAtRaw = String(formData.get("publish_at") ?? "").trim();

  if (!title) return { error: "Title is required." };
  if (!shortcontent) return { error: "A short summary is required." };
  if (!content) return { error: "Content is required." };

  let publishAt: Date | null = null;
  if (publishAtRaw) {
    const parsed = new Date(publishAtRaw);
    if (Number.isNaN(parsed.getTime())) return { error: "Invalid publish date." };
    publishAt = parsed;
  }

  const [existing] = await db
    .select({ id: blogs.id, image: blogs.image, title: blogs.title })
    .from(blogs)
    .where(eq(blogs.id, blogId));
  if (!existing) return { error: "Blog not found." };

  let categoryId: number | null = null;
  if (Number.isInteger(categoryIdRaw) && categoryIdRaw > 0) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, categoryIdRaw));
    if (!cat) return { error: "Select a valid category." };
    categoryId = categoryIdRaw;
  } else {
    return { error: "A category is required." };
  }

  let imagePath = existing.image;
  const image = formData.get("image") as File | null;
  if (image && image.size > 0) {
    try {
      imagePath = await saveUploadedImage(image, "blogs");
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Could not save the image." };
    }
  }

  const slug = existing.title !== title ? await uniqueSlug(title, blogId) : undefined;
  await db
    .update(blogs)
    .set({
      categoryId,
      title,
      slug,
      shortcontent,
      content,
      image: imagePath,
      status,
      publishAt,
      updatedAt: new Date(),
    })
    .where(eq(blogs.id, blogId));

  if (imagePath !== existing.image) await deleteStoredUpload(existing.image);

  void audit.categoryUpdated(admin.id, { action: "blog_updated", blogId, title });

  revalidatePath("/super-admin/blogs");
  return { error: null };
}

export async function deleteBlog(blogId: number): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!Number.isInteger(blogId)) return { error: "Invalid blog ID." };

  const [existing] = await db
    .select({ id: blogs.id, image: blogs.image })
    .from(blogs)
    .where(eq(blogs.id, blogId));
  if (!existing) return { error: "Blog not found." };

  const images = await db.select({ image: blogImages.image }).from(blogImages).where(eq(blogImages.blogId, blogId));
  // Child rows + blog in one transaction — a crash between deletes would
  // leave orphaned blog_images pointing at a missing blog.
  await db.transaction(async (tx) => {
    await tx.delete(blogImages).where(eq(blogImages.blogId, blogId));
    await tx.delete(blogs).where(eq(blogs.id, blogId));
  });
  await deleteStoredUpload(existing.image);
  for (const img of images) await deleteStoredUpload(img.image);

  void audit.categoryDeleted(admin.id, { action: "blog_deleted", blogId });

  revalidatePath("/super-admin/blogs");
  return { error: null };
}
