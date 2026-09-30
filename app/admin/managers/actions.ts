"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinicManagers, users } from "@/lib/db/schema";
import { requireAdminPermission } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { audit } from "@/lib/security/audit-log";

export type ActionResult = { error: string | null };

/**
 * Assign a manager to a clinic of the owner's business. The manager user
 * must exist with the `manager` role; the clinic must belong to one of the
 * owner's businesses (canAccessClinic-equivalent, resolved via scope).
 */
export async function assignManager(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const guard = await requireAdminPermission("managers", { ownerOnly: true });
  if (!guard) return { error: "Only the business owner can assign managers." };

  const userId = Number(formData.get("userId"));
  const clinicId = Number(formData.get("clinicId"));
  if (!Number.isInteger(userId) || userId <= 0) return { error: "Select a manager." };
  if (!Number.isInteger(clinicId) || clinicId <= 0) return { error: "Select a clinic." };

  const scope = await getBusinessScope();

  // Clinic must be inside the owner's scope.
  if (!scope.clinicIds.includes(clinicId)) {
    return { error: "That clinic is not part of your business." };
  }

  // Target must be an active manager-role user.
  const [manager] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(and(eq(users.id, userId), eq(users.role, "manager"), eq(users.status, "active")))
    .limit(1);
  if (!manager) return { error: "That user is not an active manager." };

  const businessId = scope.businessIds[0];
  if (!businessId) return { error: "No business found for your account." };

  try {
    await db
      .insert(clinicManagers)
      .values({ businessId, clinicId, userId, isActive: true, createdAt: new Date(), updatedAt: new Date() });
  } catch {
    return { error: "This manager is already assigned to that clinic." };
  }

  audit.settingsUpdated(guard.user.id, {
    action: "manager_assigned",
    managerId: userId,
    clinicId,
    businessId,
  });

  revalidatePath("/admin/managers");
  revalidatePath("/admin/clinics");
  return { error: null };
}

/** Deactivate a manager assignment (soft — the row stays for history). */
export async function unassignManager(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const guard = await requireAdminPermission("managers", { ownerOnly: true });
  if (!guard) return { error: "Only the business owner can remove managers." };

  const assignmentId = Number(formData.get("assignmentId"));
  if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
    return { error: "Invalid assignment." };
  }

  const scope = await getBusinessScope();
  const [row] = await db
    .select({ id: clinicManagers.id, userId: clinicManagers.userId, clinicId: clinicManagers.clinicId })
    .from(clinicManagers)
    .where(
      and(
        eq(clinicManagers.id, assignmentId),
        inArray(clinicManagers.businessId, scope.businessIds.length ? scope.businessIds : [-1])
      )
    )
    .limit(1);
  if (!row) return { error: "Assignment not found in your business." };

  await db
    .update(clinicManagers)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(clinicManagers.id, assignmentId));

  audit.settingsUpdated(guard.user.id, {
    action: "manager_unassigned",
    managerId: row.userId,
    clinicId: row.clinicId,
  });

  revalidatePath("/admin/managers");
  revalidatePath("/admin/clinics");
  return { error: null };
}

/** Create a new manager user (owner-only). Password must be changed on first login — demo seeds use a shared password. */
export async function createManager(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const guard = await requireAdminPermission("managers", { ownerOnly: true });
  if (!guard) return { error: "Only the business owner can create managers." };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!name) return { error: "Name is required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "A valid email is required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) return { error: "A user with this email already exists." };

  const { hashPassword } = await import("@/lib/auth/password");
  const [created] = await db
    .insert(users)
    .values({
      name,
      email,
      phone: phone || null,
      password: await hashPassword(password),
      role: "manager",
      status: "active",
      emailVerifiedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .$returningId();
  const managerId = Number(created.id);

  audit.settingsUpdated(guard.user.id, {
    action: "manager_created",
    managerId,
    email,
  });

  revalidatePath("/admin/managers");
  return { error: null };
}
