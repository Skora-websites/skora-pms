import type { Metadata } from "next";
import { UserCog, ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { roles, roleHasPermissions } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { PageHeader } from "@/components/ui/dashboard-ui";

export const metadata: Metadata = { title: "Roles & Permissions · Doctor" };

export default async function RolesPage() {
  const user = await requireRole(["doctor", "receptionist", "admin"]);

  const rows = await db
    .select({
      id: roles.id,
      name: roles.name,
      doctorId: roles.doctorId,
      permissionCount: sql<number>`count(${roleHasPermissions.permissionId})`,
    })
    .from(roles)
    .leftJoin(roleHasPermissions, sql`${roleHasPermissions.roleId} = ${roles.id}`)
    .groupBy(roles.id, roles.name, roles.doctorId)
    .orderBy(roles.id);

  return (
    <div>
      <PageHeader
        title="Roles & permissions"
        subtitle="Access levels for your practice"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((r) => {
          const isMine = r.doctorId === user.id;
          return (
            <div key={r.id} className="card card-hover p-6">
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                  {isMine ? <ShieldCheck className="h-5 w-5" /> : <UserCog className="h-5 w-5" />}
                </span>
                {isMine && <span className="badge bg-accent-100 text-accent-800">Your role</span>}
              </div>
              <h3 className="mt-4 font-display text-base font-bold text-slate-900">{r.name}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {Number(r.permissionCount)} permissions assigned
              </p>
              {!isMine && (
                <p className="mt-3 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500">
                  {r.doctorId ? "Custom role created for a practice" : "Platform default role"}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-6 rounded-2xl border border-brand-100 bg-brand-50/50 px-5 py-4 text-sm text-brand-900">
        💡 Role ↔ permission assignment is managed per-practice in the legacy admin UI. The
        permission model is fully compatible with <code className="font-mono text-xs">spatie/laravel-permission</code>{" "}
        so existing assignments carry over automatically.
      </p>
    </div>
  );
}
