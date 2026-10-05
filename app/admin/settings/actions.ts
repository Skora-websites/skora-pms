"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";
import { requireAdminPermission } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { audit } from "@/lib/security/audit-log";
import { isDupKey } from "@/lib/db/dup";

export type SettingsActionResult = { error: string | null };

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 255)
    .replace(/-+$/g, "");
}

/**
 * Update the owner's business profile. Editable fields match what the page
 * shows (name, email, phone, address) plus the unique slug and the active
 * toggle. Slug is validated ([a-z0-9-], no leading/trailing dash) and
 * collision-checked; leaving it blank auto-generates it from the name
 * (mirrors how the seed derives the slug).
 */
export async function updateBusiness(
  _prev: SettingsActionResult,
  formData: FormData
): Promise<SettingsActionResult> {
  const guard = await requireAdminPermission("business-settings", { ownerOnly: true });
  if (!guard) return { error: "Only the business owner can edit business settings." };

  const businessId = Number(formData.get("id"));
  if (!Number.isInteger(businessId) || businessId <= 0) return { error: "Invalid business." };

  const scope = await getBusinessScope();
  if (!scope.businessIds.includes(businessId)) {
    return { error: "That business is not yours to edit." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim() || null;
  const isActive = formData.get("is_active") === "true";
  const slugRaw = String(formData.get("slug") ?? "").trim().toLowerCase();

  if (!name) return { error: "Business name is required." };
  if (name.length > 255) return { error: "Business name must be at most 255 characters." };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email." };
  }
  if (phone && phone.length > 20) return { error: "Phone must be at most 20 characters." };

  const slug = slugRaw || slugify(name);
  if (!slug) return { error: "Slug is required (or provide a business name to auto-generate it)." };
  if (slug.length > 255) return { error: "Slug must be at most 255 characters." };
  if (!SLUG_RE.test(slug)) {
    return { error: "Slug may only contain lowercase letters, numbers and single dashes." };
  }

  const [existing] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);
  if (!existing) return { error: "Business not found." };

  // Uniqueness for the slug (skipping this business's own row).
  const [dup] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.slug, slug), ne(businesses.id, businessId)))
    .limit(1);
  if (dup) return { error: "That slug is already taken by another business." };

  // Deactivating the last active business would lock the owner out of the
  // whole panel (scope resolves to empty) — block it with a clear message.
  if (!isActive && scope.businessIds.length === 1) {
    return { error: "You cannot deactivate your only business — it would lock you out of the panel." };
  }

  try {
    await db
      .update(businesses)
      .set({
        name,
        slug,
        email,
        phone,
        address,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(businesses.id, businessId));
  } catch (err) {
    if (isDupKey(err)) return { error: "That slug is already taken by another business." };
    return { error: "Could not update business settings. Please try again." };
  }

  audit.settingsUpdated(guard.user.id, {
    action: "business_settings_updated",
    businessId,
    slug,
    isActive,
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  return { error: null };
}
