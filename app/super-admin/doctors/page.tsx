import type { Metadata } from "next";
import { UserCog } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getDoctors } from "@/lib/queries/super-admin";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui/dashboard-ui";
import { initials, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Manage Doctors · Super Admin" };

export default async function DoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireRole(["super_admin", "admin"]);
  const { q } = await searchParams;
  const doctors = await getDoctors(q);

  return (
    <div>
      <PageHeader
        title="Manage doctors"
        subtitle={`${doctors.length} registered doctor${doctors.length === 1 ? "" : "s"}`}
      />
      <form className="mb-5 flex max-w-md gap-2">
        <input name="q" defaultValue={q} placeholder="Search by name, email or phone…" className="input" />
        <button type="submit" className="btn-primary shrink-0">Search</button>
      </form>

      {doctors.length === 0 ? (
        <EmptyState icon={UserCog} title="No doctors found" description="Try a different search term." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {doctors.map((d) => (
            <div key={d.id} className="card card-hover p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 to-accent-600 text-sm font-bold text-white">
                  {initials(d.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{d.name}</p>
                  <p className="truncate text-xs text-slate-400">{d.email}</p>
                </div>
                <div className="ml-auto"><StatusBadge status={d.status ?? "active"} /></div>
              </div>
              <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <p>📞 {d.phone ?? "—"}</p>
                <p>🎓 {d.qualification ?? "—"}</p>
                <p>🪪 {d.registrationNumber ?? "—"}</p>
                <p>Joined {formatDate(d.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
