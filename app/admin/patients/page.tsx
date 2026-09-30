import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus, Users } from "lucide-react";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAdminTier } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui/dashboard-ui";
import { formatDate, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Registrations · Business" };

/**
 * Patients across the business: owned by any scoped doctor via the
 * reference_role_id ownership semantic (same as getDoctorPatients, but
 * fanned out over the scope's doctor ids).
 */
export default async function AdminPatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdminTier("/admin/patients");
  const scope = await getBusinessScope();
  const { q } = await searchParams;

  const conds = [eq(users.role, "patient"), inArray(users.referenceRoleId, scope.doctorIds.length ? scope.doctorIds : [-1])];
  if (q) {
    const like = `%${q}%`;
    conds.push(sql`(${users.name} LIKE ${like} OR ${users.phone} LIKE ${like} OR ${users.email} LIKE ${like})`);
  }

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      gender: users.gender,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(...conds))
    .orderBy(sql`${users.createdAt} DESC`)
    .limit(100);

  return (
    <div>
      <PageHeader
        title="Registrations"
        subtitle={`Patients registered under your ${scope.clinicIds.length > 1 ? "clinics" : "clinic"}`}
        action={
          <Link href="/admin/patients/new" className="btn-primary">
            <UserPlus className="h-4 w-4" />
            Add Patient
          </Link>
        }
      />

      <form action="/admin/patients" method="get" className="mt-2 flex max-w-md gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search name, phone, email…"
          className="input flex-1"
        />
        <button type="submit" className="btn-secondary">
          Search
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No patients found"
          description="Patients registered by your clinic teams will appear here."
          action={{ href: "/admin/patients/new", label: "Register patient" }}
        />
      ) : (
        <div className="table-shell mt-4">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Contact</th>
                <th>Gender</th>
                <th>Registered</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/admin/patients/${p.id}`} className="flex items-center gap-3 hover:opacity-80">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                        {initials(p.name)}
                      </span>
                      <div>
                        <p className="font-semibold text-ink">{p.name}</p>
                        <p className="text-xs text-slate-400">#{p.id}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="text-slate-500">
                    <p>{p.phone ?? "—"}</p>
                    <p className="text-xs text-slate-400">{p.email ?? ""}</p>
                  </td>
                  <td className="capitalize text-slate-500">{p.gender ?? "—"}</td>
                  <td className="text-slate-500">{formatDate(p.createdAt)}</td>
                  <td>
                    <StatusBadge status={p.status ?? "active"} />
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
