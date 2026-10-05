"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinicManagers, modelHasPermissions, permissions, users } from "@/lib/db/schema";
import { requireAdminPermission } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { audit } from "@/lib/security/audit-log";

const USER_MODEL = "App\\Models\User";

/**
 * Module perms an owner may delegate to a manager: the shared clinic-ops
 * modules ONLY. Owner-only modules (managers/clinics/business-settings) and
 * doctor-only extras are excluded by design — they can never be delegated
 * (lib/auth/permissions.ts invariant).
 *
 * Not exported: "use server" files may only export async functions.
 */
const DELEGABLE_MANAGER_MODULES = [
  "dashboard",
  "schedule",
  "registrations",
  "appointments",
  "follow-up",
  "income-expense",
  "test-booking",
  "billing",
] as const;

/**
 * Readable module catalog for the editor: module rows plus their child
 * action perms (same shape the super-admin doctor dialog consumes).
 */
export async function getManagerModuleCatalog() {
  const guard = await requireAdminPermission("managers", { ownerOnly: true });
  if (!guard) return [];
  const all = await db.select().from(permissions);
  const modules = all
    .filter((p) => p.parentId === null && (DELEGABLE_MANAGER_MODULES as readonly string[]).includes(p.name))
    .map((m) => ({
      id: m.id,
      name: m.name,
      children: all
        .filter((c) => c.parentId === m.id)
        .map((c) => ({ id: c.id, name: c.name })),
    }));
  return modules;
}

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

/**
 * Replace a manager's direct module permissions (owner-only). The manager
 * must be assigned to the owner's business. Selecting any child action
 * implies its module (legacy parity with the super-admin doctor dialog).
 * Replace runs in one transaction so a crash can't leave the manager locked
 * out of every module.
 */
export async function saveManagerPermissions(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const guard = await requireAdminPermission("managers", { ownerOnly: true });
  if (!guard) return { error: "Only the business owner can manage manager permissions." };

  const managerId = Number(formData.get("managerId"));
  if (!Number.isInteger(managerId) || managerId <= 0) return { error: "Invalid manager." };

  const scope = await getBusinessScope();
  const [assignment] = await db
    .select({ id: clinicManagers.id })
    .from(clinicManagers)
    .where(
      and(
        eq(clinicManagers.userId, managerId),
        inArray(clinicManagers.businessId, scope.businessIds.length ? scope.businessIds : [-1])
      )
    )
    .limit(1);
  if (!assignment) return { error: "That manager is not assigned to your business." };

  const [manager] = await db
    .select({ id: users.id, name: users.name, role: users.role })
    .from(users)
    .where(and(eq(users.id, managerId), eq(users.role, "manager")))
    .limit(1);
  if (!manager) return { error: "Manager account not found." };

  // Checked boxes: "perm:<name>" fields from the editor.
  const selectedNames = formData
    .getAll("perm")
    .map((v) => String(v))
    .filter(Boolean);

  // Only delegable modules and their children may be granted — strip
  // anything else (owner-only/unknown names can never arrive legitimately).
  const all = await db.select().from(permissions);
  const delegable = new Set<string>(DELEGABLE_MANAGER_MODULES);
  const childOfDelegable = new Set(
    all.filter((p) => p.parentId !== null && delegable.has(all.find((m) => m.id === p.parentId)?.name ?? "")).map((p) => p.name)
  );
  const allowed = new Set([...delegable, ...childOfDelegable]);
  const names = new Set(selectedNames.filter((n) => allowed.has(n)));

  // Child implies module (same normalization as saveDoctorPermissions).
  for (const m of all) {
    if (m.parentId === null && !delegable.has(m.name)) continue;
    if (m.parentId === null && names.size) {
      const children = all.filter((c) => c.parentId === m.id);
      if (children.some((c) => names.has(c.name))) names.add(m.name);
    }
  }

  const selected = [...names];
  let permissionIds: number[] = [];
  if (selected.length > 0) {
    const rows = await db
      .select({ id: permissions.id })
      .from(permissions)
      .where(inArray(permissions.name, selected));
    permissionIds = rows.map((r) => r.id);
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(modelHasPermissions)
      .where(and(eq(modelHasPermissions.modelId, managerId), eq(modelHasPermissions.modelType, USER_MODEL)));
    if (permissionIds.length > 0) {
      await tx
        .insert(modelHasPermissions)
        .values(permissionIds.map((permissionId) => ({ permissionId, modelType: USER_MODEL, modelId: managerId })));
    }
  });

  audit.settingsUpdated(guard.user.id, {
    action: "manager_permissions_saved",
    managerId,
    permissions: permissionIds.length,
  });

  revalidatePath("/admin/managers");
  return { error: null };
}
