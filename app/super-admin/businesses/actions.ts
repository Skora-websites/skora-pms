"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  businessClinics,
  businesses,
  clinicDoctors,
  doctorClinics,
  users,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";
import { hashPassword } from "@/lib/auth/password";
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

/**
 * Onboard a business and its owner in one step.
 *
 * The `admin` tier had no creation surface anywhere in the app: `signupAction`
 * accepts only `patient` and `doctor`, and `/admin/managers` only assigns
 * managers that already exist — so a business owner could only be produced by
 * editing the database directly. This is the missing top of the hierarchy
 * (super_admin → admin → manager → team → patient), kept behind the super-admin
 * guard rather than public signup so the open internet cannot mint accounts
 * that own a business.
 *
 * Everything lands in ONE transaction: a user without a business (or a business
 * without a clinic) is an owner who cannot use their dashboard.
 */
export async function createBusinessOwner(
  _prev: BusinessActionResult,
  formData: FormData
): Promise<BusinessActionResult> {
  const admin = await requireSuperAdmin();

  const ownerName = String(formData.get("owner_name") ?? "").trim();
  const ownerEmail = String(formData.get("owner_email") ?? "").trim().toLowerCase();
  const ownerPhone = String(formData.get("owner_phone") ?? "").trim() || null;
  const password = String(formData.get("password") ?? "");
  const businessName = String(formData.get("business_name") ?? "").trim();
  const clinicName = String(formData.get("clinic_name") ?? "").trim();
  const clinicAddress = String(formData.get("clinic_address") ?? "").trim();
  const clinicPhone = String(formData.get("clinic_phone") ?? "").trim();

  if (!ownerName) return { error: "Owner name is required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
    return { error: "A valid owner email is required." };
  }
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (!businessName) return { error: "Business name is required." };
  if (!clinicName) return { error: "Clinic name is required." };
  if (!clinicAddress) return { error: "Clinic address is required." };
  if (!clinicPhone) return { error: "Clinic phone is required." };

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, ownerEmail))
    .limit(1);
  if (existing) return { error: "A user with this email already exists." };

  const now = new Date();
  // `businesses.slug` is unique; derive it from the name plus a short suffix so
  // two similarly-named businesses cannot collide.
  const slug = `${slugify(businessName)}-${Math.random().toString(36).slice(2, 8)}`;

  const result = await db.transaction(async (tx) => {
    const [owner] = await tx
      .insert(users)
      .values({
        name: ownerName,
        email: ownerEmail,
        phone: ownerPhone,
        password: await hashPassword(password),
        role: "admin",
        status: "active",
        emailVerifiedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .$returningId();
    const ownerId = Number(owner.id);

    const [business] = await tx
      .insert(businesses)
      .values({
        ownerId,
        name: businessName,
        slug,
        email: ownerEmail,
        phone: ownerPhone,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .$returningId();
    const businessId = Number(business.id);

    const [clinic] = await tx
      .insert(doctorClinics)
      .values({
        doctorId: ownerId,
        clinicName,
        addressType: "manual",
        address: clinicAddress,
        phone: clinicPhone,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .$returningId();
    const clinicId = Number(clinic.id);

    await tx
      .insert(businessClinics)
      .values({ businessId, clinicId, isPrimary: true, createdAt: now, updatedAt: now });

    // The owner is a member of their own clinic: clinic-scoped reads and the
    // booking dropdown resolve through `clinic_doctors`.
    await tx
      .insert(clinicDoctors)
      .values({ clinicId, doctorId: ownerId, isActive: true });

    return { ownerId, businessId, clinicId };
  });

  audit.settingsUpdated(admin.id, {
    action: "business_owner_created",
    ownerId: result.ownerId,
    businessId: result.businessId,
    clinicId: result.clinicId,
    ownerEmail,
  });

  revalidatePath("/super-admin/businesses");
  return { error: null };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "business";
}
