"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinicManagers, modelHasPermissions, permissions, users } from "@/lib/db/schema";
import { requireAdminPermission } from "@/lib/auth/guard";
import { ADMIN_ROUTE_PERMISSIONS, type AdminNavPerm } from "@/lib/auth/permissions";
import { getBusinessScope } from "@/lib/auth/scope";
import { audit } from "@/lib/security/audit-log";
import { hashPassword } from "@/lib/auth/password";
import { countPracticeStaff, getPracticeEntitlements } from "@/lib/queries/packages";
import { seatLimitMessage, seatLimitReached } from "@/lib/packages/entitlements";

const USER_MODEL = "App\\Models\\User";

/**
 * Modules an owner may delegate to a clinic manager: every module except the
 * three owner-only ones (`managers`, `clinics`, `business-settings`), which
 * `hasAdminModuleAccess` enforces on `viewerRole` rather than on a permission.
 *
 * Derived from the route map instead of restated, so a new `/admin` module
 * becomes delegable the moment it appears in ADMIN_ROUTE_PERMISSIONS and the
 * two lists can never drift. The previous hand-written list stopped at eight
 * modules, so the owner-parity modules (`home-visit`, `chat`, `shop`,
 * `support`, `consultations`, `online-consultations`) could never be granted —
 * contradicting ADMIN_ROUTE_PERMISSIONS' own comment (audit M2).
 */
const DELEGABLE_MANAGER_MODULES: readonly AdminNavPerm[] = ADMIN_ROUTE_PERMISSIONS.filter(
  (entry) => !entry.ownerOnly
).map((entry) => entry.perm);

/**
 * Modules a brand-new manager starts with (role model D2: the clinic-ops core
 * plus finance). Everything else stays opt-in through the permissions editor,
 * so a new manager is useful on day one without inheriting the wider modules
 * (chat, shop, consultations, clinic staff) they may not be meant to open.
 */
const DEFAULT_MANAGER_MODULES: readonly AdminNavPerm[] = [
  "dashboard",
  "schedule",
  "registrations",
  "appointments",
  "follow-up",
  "income-expense",
  "test-booking",
  "billing",
];

/** `name -> true` membership index over DELEGABLE_MANAGER_MODULES. */
const DELEGABLE_MODULE_INDEX: Record<string, true> = {};
for (const name of DELEGABLE_MANAGER_MODULES) DELEGABLE_MODULE_INDEX[name] = true;

/**
 * Readable module catalog for the editor: module rows plus their child
 * action perms (same shape the super-admin doctor dialog consumes).
 */
export async function getManagerModuleCatalog() {
  const guard = await requireAdminPermission("managers", { ownerOnly: true });
  if (!guard) return [];
  const all = await db.select().from(permissions);
  const modules = all
    .filter((p) => p.parentId === null && DELEGABLE_MODULE_INDEX[p.name] === true)
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

  // Plan limit (parity with /doctor/staff): a manager is a staff seat, and
  // the plan belongs to the practice anchor doctor — the same anchor the
  // owner's checkout credits. Seats count across the whole business, so the
  // number enforced here is the number the owner's plan card shows. Existing
  // managers are never revoked; only additions are blocked.
  const scope = await getBusinessScope();
  if (scope.doctorIds.length > 0) {
    const [entitlements, seatsUsed] = await Promise.all([
      getPracticeEntitlements(scope.doctorIds[0]),
      countPracticeStaff(scope.doctorIds),
    ]);
    if (seatLimitReached(entitlements, seatsUsed)) {
      return { error: seatLimitMessage(entitlements) };
    }
  }

  // Resolve the documented default set (clinic-ops core + finance) against the
  // live catalog before opening the write, so an unknown module name can't
  // abort a user insert with a dangling foreign key.
  const defaults = DEFAULT_MANAGER_MODULES as readonly string[];
  const defaultRows = defaults.length > 0
    ? await db.select({ id: permissions.id }).from(permissions).where(inArray(permissions.name, defaults))
    : [];

  // User row + its default grants in one transaction: a crash in between would
  // otherwise leave a grant-less manager, which requireAdminTier could only
  // bounce to the public marketing site (audit L5).
  const managerId = await db.transaction(async (tx) => {
    const [created] = await tx
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
    const id = Number(created.id);
    if (defaultRows.length > 0) {
      await tx
        .insert(modelHasPermissions)
        .values(defaultRows.map((p) => ({ permissionId: p.id, modelType: USER_MODEL, modelId: id })));
    }
    return id;
  });

  audit.settingsUpdated(guard.user.id, {
    action: "manager_created",
    managerId,
    email,
    modules: defaultRows.length,
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
  const delegable = DELEGABLE_MODULE_INDEX;
  const childOfDelegable = new Set(
    all.filter((p) => p.parentId !== null && delegable[all.find((m) => m.id === p.parentId)?.name ?? ""] === true).map((p) => p.name)
  );
  const allowed = new Set<string>([
    ...DELEGABLE_MANAGER_MODULES.map((name) => name as string),
    ...childOfDelegable,
  ]);
  const names = new Set(selectedNames.filter((n) => allowed.has(n)));

  // Child implies module (same normalization as saveDoctorPermissions).
  for (const m of all) {
    if (m.parentId === null && !delegable[m.name]) continue;
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
