import type { Metadata } from "next";
import { Users } from "lucide-react";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinicDoctors, users } from "@/lib/db/schema";
import { requireAdminTier } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui/dashboard-ui";
import { initials, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Clinic Staff · Business" };

/**
 * Team members (doctors + receptionists) attached to the scoped clinics via
 * clinic_doctors membership. The admin tier views the roster; membership
 * management itself stays with the clinic-owning doctor on /doctor/schedule.
 */
export default async function AdminStaffPage() {
  await requireAdminTier("/admin/staff");
  const scope = await getBusinessScope();
  const clinicIds = scope.clinicIds.length ? scope.clinicIds : [-1];

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      specialization: users.specialization,
      status: users.status,
      createdAt: users.createdAt,
      clinicId: clinicDoctors.clinicId,
    })
    .from(clinicDoctors)
    .innerJoin(users, eq(users.id, clinicDoctors.doctorId))
    .where(inArray(clinicDoctors.clinicId, clinicIds));

  // Dedupe doctors who practice at multiple scoped clinics.
  const seen = new Set<number>();
  const members = rows.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Clinic staff"
        subtitle={`Doctors and team members across ${scope.clinicIds.length} clinic${scope.clinicIds.length === 1 ? "" : "s"}`}
      />

      {members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team members yet"
          description="Doctors at your clinics will appear here."
        />
      ) : (
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Specialization</th>
                <th>Contact</th>
                <th>Joined</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                        {initials(m.name)}
                      </span>
                      <p className="font-semibold text-ink">{m.name}</p>
                    </div>
                  </td>
                  <td className="capitalize text-slate-500">{m.role}</td>
                  <td className="text-slate-500">{m.specialization ?? "—"}</td>
                  <td className="text-slate-500">
                    <p>{m.phone ?? "—"}</p>
                    <p className="text-xs text-slate-400">{m.email ?? ""}</p>
                  </td>
                  <td className="text-slate-500">{formatDate(m.createdAt)}</td>
                  <td>
                    <StatusBadge status={m.status ?? "active"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
