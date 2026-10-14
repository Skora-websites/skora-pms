"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/user";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { landingSections, landingItems } from "@/lib/db/schema";
import { MAX_IMAGE_BYTES } from "@/lib/config";
import { audit } from "@/lib/security/audit-log";
import { saveUploadedImage, deleteStoredUpload } from "@/lib/uploads/media";

/** Shared super-admin guard + result type (previously in the one big actions.ts). */
export type AdminActionResult = { error: string | null };

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "super_admin") redirect("/login");
  return user;
}

// ── Landing CMS (legacy `LandingPageController` parity) ─────────────────────

export async function updateLandingSection(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const sectionKey = String(formData.get("section_key") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const isActive = formData.get("is_active") === "1" || formData.get("is_active") === "on";
  const metadataRaw = String(formData.get("metadata") ?? "").trim();

  const [section] = await db
    .select()
    .from(landingSections)
    .where(eq(landingSections.key, sectionKey));
  if (!section) return { error: "Section not found." };

  let metadata = section.metadata as Record<string, unknown> | null;
  if (metadataRaw) {
    try {
      const parsed = JSON.parse(metadataRaw);
      if (parsed && typeof parsed === "object") {
        metadata = { ...(metadata ?? {}), ...parsed };
      }
    } catch {
      return { error: "Metadata must be valid JSON." };
    }
  }

  await db
    .update(landingSections)
    .set({
      title: title || null,
      subtitle: subtitle || null,
      isActive,
      metadata,
      updatedAt: new Date(),
    })
    .where(eq(landingSections.key, sectionKey));

  void audit.settingsUpdated(admin.id, { action: "landing_section_updated", sectionKey });

  revalidatePath("/super-admin/landing");
  return { error: null };
}

export async function storeLandingItem(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const sectionKey = String(formData.get("section_key") ?? "");
  const [section] = await db
    .select({ key: landingSections.key })
    .from(landingSections)
    .where(eq(landingSections.key, sectionKey));
  if (!section) return { error: "Section not found." };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const badge = String(formData.get("badge") ?? "").trim();
  const link = String(formData.get("link") ?? "").trim();
  const linkText = String(formData.get("link_text") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  const featuresRaw = String(formData.get("features") ?? "").trim();
  const priceMonthly = String(formData.get("price_monthly") ?? "").trim();
  const priceYearly = String(formData.get("price_yearly") ?? "").trim();
  const priceOriginalMonthly = String(formData.get("price_original_monthly") ?? "").trim();
  const priceOriginalYearly = String(formData.get("price_original_yearly") ?? "").trim();
  const stars = String(formData.get("stars") ?? "").trim();
  const isActive = formData.get("is_active") === "1" || formData.get("is_active") === "on";

  if (!title) return { error: "Title is required." };
  if (title.length > 255) return { error: "Title must be at most 255 characters." };

  const features = featuresRaw
    ? featuresRaw
        .split(/\n|,/)
        .map((s) => s.trim())
        .filter(Boolean)
    : null;

  let imagePath: string | null = null;
  const image = formData.get("image") as File | null;
  if (image && image.size > 0) {
    try {
      imagePath = await saveUploadedImage(image, "landing");
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Could not save the image." };
    }
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(landingItems)
    .where(eq(landingItems.sectionKey, sectionKey));

  const [created] = await db
    .insert(landingItems)
    .values({
      sectionKey,
      title,
      description: description || null,
      badge: badge || null,
      link: link || null,
      linkText: linkText || null,
      icon: icon || null,
      image: imagePath,
      priceMonthly: priceMonthly ? Number(priceMonthly).toFixed(2) : null,
      priceYearly: priceYearly ? Number(priceYearly).toFixed(2) : null,
      priceOriginalMonthly: priceOriginalMonthly ? Number(priceOriginalMonthly).toFixed(2) : null,
      priceOriginalYearly: priceOriginalYearly ? Number(priceOriginalYearly).toFixed(2) : null,
      features,
      stars: stars ? Number(stars) : null,
      order: Number(count),
      isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .$returningId();

  void audit.categoryCreated(admin.id, {
    action: "landing_item_created",
    sectionKey,
    itemId: Number(created.id),
    title,
  });

  revalidatePath("/super-admin/landing");
  return { error: null };
}

export async function updateLandingItem(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const itemId = Number(formData.get("id"));
  if (!Number.isInteger(itemId)) return { error: "Invalid item ID." };

  const [existing] = await db.select().from(landingItems).where(eq(landingItems.id, itemId));
  if (!existing) return { error: "Item not found." };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const badge = String(formData.get("badge") ?? "").trim();
  const link = String(formData.get("link") ?? "").trim();
  const linkText = String(formData.get("link_text") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  const featuresRaw = String(formData.get("features") ?? "").trim();
  const priceMonthly = String(formData.get("price_monthly") ?? "").trim();
  const priceYearly = String(formData.get("price_yearly") ?? "").trim();
  const priceOriginalMonthly = String(formData.get("price_original_monthly") ?? "").trim();
  const priceOriginalYearly = String(formData.get("price_original_yearly") ?? "").trim();
  const stars = String(formData.get("stars") ?? "").trim();
  const isActive = formData.get("is_active") === "1" || formData.get("is_active") === "on";

  if (!title) return { error: "Title is required." };

  const features = featuresRaw
    ? featuresRaw
        .split(/\n|,/)
        .map((s) => s.trim())
        .filter(Boolean)
    : null;

  let imagePath = existing.image;
  const image = formData.get("image") as File | null;
  if (image && image.size > 0) {
    try {
      imagePath = await saveUploadedImage(image, "landing");
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Could not save the image." };
    }
  }

  await db
    .update(landingItems)
    .set({
      title,
      description: description || null,
      badge: badge || null,
      link: link || null,
      linkText: linkText || null,
      icon: icon || null,
      image: imagePath,
      priceMonthly: priceMonthly ? Number(priceMonthly).toFixed(2) : null,
      priceYearly: priceYearly ? Number(priceYearly).toFixed(2) : null,
      priceOriginalMonthly: priceOriginalMonthly ? Number(priceOriginalMonthly).toFixed(2) : null,
      priceOriginalYearly: priceOriginalYearly ? Number(priceOriginalYearly).toFixed(2) : null,
      features,
      stars: stars ? Number(stars) : null,
      isActive,
      updatedAt: new Date(),
    })
    .where(eq(landingItems.id, itemId));

  if (imagePath !== existing.image) await deleteStoredUpload(existing.image);

  void audit.categoryUpdated(admin.id, { action: "landing_item_updated", itemId, title });

  revalidatePath("/super-admin/landing");
  return { error: null };
}

export async function deleteLandingItem(itemId: number): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!Number.isInteger(itemId)) return { error: "Invalid item ID." };

  const [existing] = await db
    .select({ id: landingItems.id, image: landingItems.image })
    .from(landingItems)
    .where(eq(landingItems.id, itemId));
  if (!existing) return { error: "Item not found." };

  await db.delete(landingItems).where(eq(landingItems.id, itemId));
  await deleteStoredUpload(existing.image);

  void audit.categoryDeleted(admin.id, { action: "landing_item_deleted", itemId });

  revalidatePath("/super-admin/landing");
  return { error: null };
}

/** Move a landing item up/down within its section (swaps the order field). */
export async function reorderLandingItem(
  itemId: number,
  direction: "up" | "down"
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!Number.isInteger(itemId)) return { error: "Invalid item ID." };
  if (direction !== "up" && direction !== "down") return { error: "Invalid direction." };

  const [item] = await db
    .select({ id: landingItems.id, sectionKey: landingItems.sectionKey, order: landingItems.order })
    .from(landingItems)
    .where(eq(landingItems.id, itemId));
  if (!item) return { error: "Item not found." };

  const siblings = await db
    .select({ id: landingItems.id, order: landingItems.order })
    .from(landingItems)
    .where(eq(landingItems.sectionKey, item.sectionKey))
    .orderBy(asc(landingItems.order), asc(landingItems.id));

  const idx = siblings.findIndex((s) => s.id === itemId);
  const target = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || target < 0 || target >= siblings.length) return { error: null }; // at edge

  // Both order swaps in one transaction — a crash between updates would
  // leave two items sharing the same order value.
  const other = siblings[target];
  await db.transaction(async (tx) => {
    await tx
      .update(landingItems)
      .set({ order: other.order ?? 0, updatedAt: new Date() })
      .where(eq(landingItems.id, itemId));
    await tx
      .update(landingItems)
      .set({ order: item.order ?? 0, updatedAt: new Date() })
      .where(eq(landingItems.id, other.id));
  });

  void audit.categoryUpdated(admin.id, { action: "landing_item_reordered", itemId, direction });

  revalidatePath("/super-admin/landing");
  return { error: null };
}
