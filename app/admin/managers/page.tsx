import type { Metadata } from "next";
import { UserCog } from "lucide-react";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinicManagers, doctorClinics, modelHasPermissions, permissions, users } from "@/lib/db/schema";
import { requireAdminTier } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { PageHeader, EmptyState } from "@/components/ui/dashboard-ui";
import { ManagerForm, ManagerList } from "./managers-client";
import { getManagerModuleCatalog } from "./actions";

export const metadata: Metadata = { title: "Managers · Business" };

export default async function AdminManagersPage() {
  await requireAdminTier("/admin/managers");
  const scope = await getBusinessScope();
  const clinicIds = scope.clinicIds.length ? scope.clinicIds : [-1];

  const [assignments, clinics, managerUserRows, catalog, permRows] = await Promise.all([
    db
      .select({
        id: clinicManagers.id,
        clinicId: clinicManagers.clinicId,
        userId: clinicManagers.userId,
        isActive: clinicManagers.isActive,
        createdAt: clinicManagers.createdAt,
        managerName: users.name,
        managerEmail: users.email,
      })
      .from(clinicManagers)
      .innerJoin(users, eq(users.id, clinicManagers.userId))
      .where(inArray(clinicManagers.businessId, scope.businessIds.length ? scope.businessIds : [-1]))
      .orderBy(asc(clinicManagers.id)),
    db
      .select({ id: doctorClinics.id, clinicName: doctorClinics.clinicName })
      .from(doctorClinics)
      .where(inArray(doctorClinics.id, clinicIds))
      .orderBy(asc(doctorClinics.id)),
    db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.role, "manager"))
      .orderBy(asc(users.name)),
    getManagerModuleCatalog(),
    db
      .select({ modelId: modelHasPermissions.modelId, name: permissions.name })
      .from(modelHasPermissions)
      .innerJoin(permissions, eq(permissions.id, modelHasPermissions.permissionId))
      .where(eq(modelHasPermissions.modelType, "App\\Models\\User")),
  ]);

  // Direct permission names per manager (module + action rows).
  const permsByManagerId = new Map<number, Set<string>>();
  const managerIdSet = new Set(managerUserRows.map((m) => m.id));
  for (const row of permRows) {
    if (!managerIdSet.has(row.modelId)) continue;
    const set = permsByManagerId.get(row.modelId) ?? new Set<string>();
    set.add(row.name);
    permsByManagerId.set(row.modelId, set);
  }

  const managerUsers = managerUserRows.map((m) => ({ ...m, email: m.email ?? "" }));
  const clinicNames = new Map(clinics.map((c) => [c.id, c.clinicName]));

  return (
    <div>
      <PageHeader
        title="Managers"
        subtitle="Assign managers to clinics — they see only the clinics you give them"
      />

      <ManagerForm clinics={clinics} managerUsers={managerUsers} />

      {assignments.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No managers assigned"
          description="Create a manager account and assign it to a clinic to delegate clinic operations."
        />
      ) : (
        <ManagerList
          assignments={assignments.map((a) => ({
            id: a.id,
            managerId: a.userId,
            managerName: a.managerName,
            managerEmail: a.managerEmail,
            clinicName: clinicNames.get(a.clinicId) ?? `Clinic #${a.clinicId}`,
            isActive: a.isActive ?? true,
            createdAt: a.createdAt,
          }))}
          catalog={catalog}
          permsByManagerId={permsByManagerId}
        />
      )}
    </div>
  );
}
