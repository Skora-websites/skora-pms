import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { resolvePracticeDoctorId } from "@/lib/queries/doctor";
import { getPracticeEntitlements } from "@/lib/queries/packages";
import { featureBlockedMessage } from "@/lib/packages/entitlements";
import {
  listPermissionsByRole,
  listPracticeReceptionistOptions,
  listRolesWithPermissionCounts,
} from "@/lib/queries/admin";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { RoleForm } from "./role-form";
import { RoleCardActions } from "./role-card-actions";
import { StaffPermissionManager } from "./staff-permission-manager";
import { getAllPermissions } from "./actions";

export const metadata: Metadata = { title: "Roles & Permissions · Doctor" };

export default async function RolesPage() {
  const user = await requireRole(["doctor", "receptionist"]);
  const doctorId = resolvePracticeDoctorId(user);

  // Reads stay open on every plan (a Package 1 practice must still see its
  // existing roles); only the write actions are gated, and the notice below
  // explains the boundary instead of silently failing on save.
  const entitlements = await getPracticeEntitlements(doctorId);

  const [rows, receptionists, permissionModules] = await Promise.all([
    listRolesWithPermissionCounts(doctorId),
    listPracticeReceptionistOptions(doctorId),
    getAllPermissions(),
  ]);

  // Permission names per custom role (for the edit form). Scoped to the
  // practice's own role ids — no unfiltered join over every practice's
  // role-permission rows (F-06).
  const permsByRole = await listPermissionsByRole(rows.map((r) => r.id));
  const rolesWithPerms = rows.map((r) => ({ ...r, permissionNames: permsByRole.get(r.id) ?? [] }));
  const rolePlanNotice = featureBlockedMessage(entitlements, "roleManagement");

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageHeader
          title="Roles & permissions"
          subtitle="Access levels for your practice — role permissions flow to staff automatically"
        />
        <RoleForm modules={permissionModules} />
      </div>

      {rolePlanNotice && (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          {rolePlanNotice}
        </p>
      )}

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
              <h3 className="mt-4 text-[17px] font-semibold tracking-[-0.01em] text-ink">{r.name}</h3>
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