import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { roles, roleHasPermissions, permissions, users } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { RoleForm } from "./role-form";
import { RoleCardActions } from "./role-card-actions";
import { StaffPermissionManager } from "./staff-permission-manager";
import { getAllPermissions } from "./actions";

export const metadata: Metadata = { title: "Roles & Permissions · Doctor" };

export default async function RolesPage() {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;

  const [rows, receptionists, permissionModules] = await Promise.all([
    db
      .select({
        id: roles.id,
        name: roles.name,
        doctorId: roles.doctorId,
        permissionCount: sql<number>`count(${roleHasPermissions.permissionId})`,
      })
      .from(roles)
      .leftJoin(roleHasPermissions, sql`${roleHasPermissions.roleId} = ${roles.id}`)
      .where(eq(roles.doctorId, doctorId))
      .groupBy(roles.id, roles.name, roles.doctorId)
      .orderBy(roles.id),
    db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(and(eq(users.referenceRoleId, doctorId), eq(users.role, "receptionist")))
      .orderBy(users.name),
    getAllPermissions(),
  ]);

  // Permission names per custom role (for the edit form).
  const rolePermRows = await db
    .select({ roleId: roleHasPermissions.roleId, name: permissions.name })
    .from(roleHasPermissions)
    .innerJoin(permissions, eq(permissions.id, roleHasPermissions.permissionId));
  const permsByRole = new Map<number, string[]>();
  for (const rp of rolePermRows) {
    const list = permsByRole.get(rp.roleId) ?? [];
    list.push(rp.name);
    permsByRole.set(rp.roleId, list);
  }

  const rolesWithPerms = rows.map((r) => ({ ...r, permissionNames: permsByRole.get(r.id) ?? [] }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageHeader
          title="Roles & permissions"
          subtitle="Access levels for your practice — role permissions flow to staff automatically"
        />
        <RoleForm modules={permissionModules} />
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 px-5 py-8 text-center text-sm text-slate-400">
          No custom roles yet. Create your first role to define what staff can access.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rolesWithPerms.map((r) => (
            <div key={r.id} className="card card-hover p-6">
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <RoleCardActions role={r} modules={permissionModules} />
              </div>
              <h3 className="mt-4 font-display text-base font-bold text-slate-900">{r.name}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {Number(r.permissionCount)} permission{Number(r.permissionCount) === 1 ? "" : "s"} assigned
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10">
        <StaffPermissionManager receptionists={receptionists} modules={permissionModules} />
      </div>
    </div>
  );
}