import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getUsers } from "@/lib/queries/super-admin";
import { PageHeader, EmptyState } from "@/components/ui/dashboard-ui";
import { UsersTable } from "./users-table";

export const metadata: Metadata = { title: "Manage Users · Super Admin" };

const ROLES = ["all", "super_admin", "admin", "doctor", "receptionist", "patient"];

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>;
}) {
  const me = await requireRole(["super_admin", "admin"]);
  const { role = "all", q } = await searchParams;
  const users = await getUsers(role, q);

  const rows = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    status: u.status ?? "active",
    createdAt: u.createdAt ? u.createdAt.toISOString() : null,
    trialEndsAt: u.trialEndsAt ? u.trialEndsAt.toISOString() : null,
  }));

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
        <UsersTable users={rows} currentUserId={me.id} />
      )}
    </div>
  );
}