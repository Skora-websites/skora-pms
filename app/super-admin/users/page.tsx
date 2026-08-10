import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getUsers } from "@/lib/queries/super-admin";
import { PageHeader, StatusBadge, EmptyState } from "@/components/ui/dashboard-ui";
import { formatDate, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Manage Users · Super Admin" };

const ROLES = ["all", "super_admin", "admin", "doctor", "receptionist", "patient"];

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>;
}) {
  await requireRole(["super_admin", "admin"]);
  const { role = "all", q } = await searchParams;
  const users = await getUsers(role, q);

  return (
    <div>
      <PageHeader title="Manage users" subtitle={`${users.length} accounts in the platform`} />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <Link
              key={r}
              href={`/super-admin/users?role=${r}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                role === r
                  ? "bg-navy-950 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-800"
              }`}
            >
              {r.replace(/_/g, " ")}
            </Link>
          ))}
        </div>
        <form className="ml-auto flex max-w-xs flex-1 gap-2">
          <input name="q" defaultValue={q} placeholder="Search…" className="input" />
          <input type="hidden" name="role" value={role} />
          <button type="submit" className="btn-primary shrink-0">Go</button>
        </form>
      </div>

      {users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Try adjusting your filters." />
      ) : (
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-navy-800 to-brand-700 text-xs font-bold text-white">
                        {initials(u.name)}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.email ?? "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge bg-slate-100 capitalize text-slate-700">{u.role.replace(/_/g, " ")}</span>
                  </td>
                  <td>{u.phone ?? "—"}</td>
                  <td><StatusBadge status={u.status ?? "active"} /></td>
                  <td>{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
