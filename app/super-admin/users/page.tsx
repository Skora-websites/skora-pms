import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getUsers, getUsersCount } from "@/lib/queries/super-admin";
import { PageHeader, EmptyState } from "@/components/ui/dashboard-ui";
import { UsersTable } from "./users-table";

export const metadata: Metadata = { title: "Manage Users · Super Admin" };

const ROLES = ["all", "super_admin", "admin", "doctor", "receptionist", "patient"];
const PAGE_SIZE = 25;

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string; page?: string }>;
}) {
  const me = await requireRole(["super_admin", "admin"]);
  const { role = "all", q, page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;
  const [users, total] = await Promise.all([
    getUsers(role, q, { limit: PAGE_SIZE, offset }),
    getUsersCount(role, q),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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
      <PageHeader title="Manage users" subtitle={`${total} accounts in the platform`} />

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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/super-admin/users?role=${role}&q=${q ?? ""}&page=${p}`}
              className={`flex h-9 w-9 items-center justify-center rounded-lg font-semibold transition-colors ${
                p === currentPage
                  ? "bg-brand-700 text-white"
                  : "border border-slate-200 text-slate-600 hover:border-brand-300"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}