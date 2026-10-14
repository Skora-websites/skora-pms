"use server";

import { redirect } from "next/navigation";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { permissions, modelHasPermissions, users } from "@/lib/db/schema";
import { getCurrentUser, hasPermission, homePathForRole } from "@/lib/auth/user";
import { resolvePracticeDoctorId } from "@/lib/queries/doctor";

const USER_MODEL = "App\\Models\\User";

/**
 * Permission catalog queries shared across role tiers.
 *
 * Both the doctor's own roles page and the super-admin's doctor-permissions
 * screen need the same two reads, so they live here rather than in
 * app/doctor/roles/actions.ts — a route group must never import another route
 * group's actions (see docs/architecture/server-actions.md).
 *
 * These carry authorization logic, not plain reads, which is why they are
 * actions rather than lib/queries entries.
 */

/** May this caller see the permission catalog at all? */
async function canViewPermissionData(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "super_admin") return true;
  // admin (business owner) moved to the /admin tier — no doctor-tier bypass.
  if (user.role !== "doctor" && user.role !== "receptionist") {
    redirect(homePathForRole(user.role));
  }
  return hasPermission(user.id, "roles-permissions");
}

/** Permission names grouped by module (parent). Mirrors legacy `allPermissions`. */
export async function getAllPermissions() {
  if (!(await canViewPermissionData())) return [];
  const all = await db.select().from(permissions).orderBy(permissions.id);
  const modules = all.filter((p) => p.parentId === null);
  const children = all.filter((p) => p.parentId !== null);

  return modules.map((m) => ({
    id: m.id,
    name: m.name,
    permissions: children.filter((c) => c.parentId === m.id),
  }));
}

/**
 * Permission names granted to a user.
 *
 * Platform operators (super_admin / admin) may inspect anyone; practice staff
 * need `roles-permissions` AND the target must be a receptionist of their own
 * practice.
 */
export async function getUserPermissionNames(userId: number): Promise<string[]> {
  if (!userId || !Number.isInteger(userId)) return [];
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role !== "super_admin" && user.role !== "admin") {
    if (user.role !== "doctor" && user.role !== "receptionist") {
      redirect(homePathForRole(user.role));
    }
    if (!(await hasPermission(user.id, "roles-permissions"))) return [];
    const doctorId = resolvePracticeDoctorId(user);
    const [staff] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.id, userId),
          or(eq(users.referenceRoleId, doctorId), eq(users.doctorId, doctorId)),
          eq(users.role, "receptionist")
        )
      );
    if (!staff) return [];
  }

  const rows = await db
    .select({ name: permissions.name })
    .from(permissions)
    .innerJoin(modelHasPermissions, eq(modelHasPermissions.permissionId, permissions.id))
    .where(and(eq(modelHasPermissions.modelId, userId), eq(modelHasPermissions.modelType, USER_MODEL)));
  return rows.map((r) => r.name);
}
