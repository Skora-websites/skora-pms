"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses, users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";
import { audit } from "@/lib/security/audit-log";

export type BusinessActionResult = { error: string | null };

async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "super_admin") redirect("/login");
  return user;
}

/** Toggle a business's active state. Inactive businesses hide their owner's /admin views (getBusinessScope filters isActive). */
export async function toggleBusinessStatus(
  businessId: number
): Promise<BusinessActionResult> {
  const admin = await requireSuperAdmin();
  if (!Number.isInteger(businessId)) return { error: "Invalid business ID." };

  const [existing] = await db
    .select({ id: businesses.id, isActive: businesses.isActive })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);
  if (!existing) return { error: "Business not found." };

  const next = !(existing.isActive ?? true);
  await db
    .update(businesses)
    .set({ isActive: next, updatedAt: new Date() })
    .where(eq(businesses.id, businessId));

  audit.settingsUpdated(admin.id, {
    action: "business_status_toggled",
    businessId,
    isActive: next,
  });

  revalidatePath("/super-admin/businesses");
  return { error: null };
}

/** Deactivate the owner account of a business (delegates to status toggle semantics). */
export async function toggleBusinessOwnerStatus(
  ownerId: number
): Promise<BusinessActionResult> {
  const admin = await requireSuperAdmin();
  if (!Number.isInteger(ownerId)) return { error: "Invalid owner ID." };

  const [owner] = await db
    .select({ id: users.id, role: users.role, status: users.status })
    .from(users)
    .where(eq(users.id, ownerId))
    .limit(1);
  if (!owner) return { error: "Owner not found." };
  if (owner.role === "super_admin") {
    return { error: "You cannot change the status of a super admin." };
  }

  const nextStatus = owner.status === "active" ? "inactive" : "active";
  await db
    .update(users)
    .set({ status: nextStatus, updatedAt: new Date() })
    .where(eq(users.id, ownerId));

  audit.roleChanged(admin.id, {
    action: "business_owner_status_toggled",
    ownerId,
    status: nextStatus,
  });

  revalidatePath("/super-admin/businesses");
  return { error: null };
}
