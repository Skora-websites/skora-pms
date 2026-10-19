import type { Metadata } from "next";
import { UserCog } from "lucide-react";
import { requireAdminTier } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import {
  listDirectManagerPermissions,
  listManagerAssignments,
  listManagerUsersInScope,
  listScopedClinics,
  scopeOrSentinel,
} from "@/lib/queries/admin";
import { PageHeader, EmptyState } from "@/components/ui/dashboard-ui";
import { ManagerForm, ManagerList } from "./managers-client";
import { getManagerModuleCatalog } from "./actions";

export const metadata: Metadata = { title: "Managers · Business" };

export default async function AdminManagersPage() {
  await requireAdminTier("/admin/managers");
  const scope = await getBusinessScope();

  const [assignments, clinics, managerUserRows, catalog, permRows] = await Promise.all([
    listManagerAssignments(scopeOrSentinel(scope.businessIds)),
    listScopedClinics(scopeOrSentinel(scope.clinicIds)),
    listManagerUsersInScope(scopeOrSentinel(scope.clinicIds)),
    getManagerModuleCatalog(),
    // Unscoped, but the page filters it down to the scoped manager ids below
    // (audit M6) — so a foreign business's grants are read then discarded.
    listDirectManagerPermissions(),
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
