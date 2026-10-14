"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/user";
import { db } from "@/lib/db";
import { and, eq, inArray } from "drizzle-orm";
import { users, permissions, modelHasPermissions } from "@/lib/db/schema";
import { MAX_IMAGE_BYTES } from "@/lib/config";

import { audit } from "@/lib/security/audit-log";

/** Shared super-admin guard + result type (previously in the one big actions.ts). */
export type AdminActionResult = { error: string | null };

const USER_MODEL = "App\\Models\\User";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "super_admin") redirect("/login");
  return user;
}

// ── Doctor permissions sync (legacy `syncDoctorPermissions`) ────────────────

export async function saveDoctorPermissions(
  doctorId: number,
  permissionNames: string[]
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!Number.isInteger(doctorId)) return { error: "Invalid doctor ID." };

  const [doctor] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(and(eq(users.id, doctorId), eq(users.role, "doctor")));
  if (!doctor) return { error: "Doctor not found." };

  // Normalize the module hierarchy: selecting any child of a module
  // implies the module name itself (legacy parity).
  const all = await db.select().from(permissions);
  const names = new Set(permissionNames);
  const modules = all.filter((p) => p.parentId === null);
  for (const m of modules) {
    const children = all.filter((c) => c.parentId === m.id);
    if (children.some((c) => names.has(c.name))) names.add(m.name);
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

  // Replace permissions atomically — a crash between delete and insert would
  // leave the doctor with no dashboard access at all.
  await db.transaction(async (tx) => {
    await tx
      .delete(modelHasPermissions)
      .where(and(eq(modelHasPermissions.modelId, doctorId), eq(modelHasPermissions.modelType, USER_MODEL)));
    if (permissionIds.length > 0) {
      await tx
        .insert(modelHasPermissions)
        .values(permissionIds.map((permissionId) => ({ permissionId, modelType: USER_MODEL, modelId: doctorId })));
    }
  });

  void audit.roleChanged(admin.id, {
    action: "doctor_permissions_saved",
    doctorId,
    doctorName: doctor.name,
    permissions: permissionIds.length,
  });

  revalidatePath("/super-admin/doctors");
  return { error: null };
}
