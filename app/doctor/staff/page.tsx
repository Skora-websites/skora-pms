import type { Metadata } from "next";
import { Users } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader, EmptyState } from "@/components/ui/dashboard-ui";
import { initials, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My Staff · Doctor" };

export default async function StaffPage() {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;

  const staff = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.doctorId, doctorId))
    .orderBy(users.createdAt);

  return (
    <div>
      <PageHeader
        title="My staff"
        subtitle="Team members linked to your practice"
      />

      {staff.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No staff members yet"
          description="Staff members assigned to your clinic will appear here."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {staff.map((s) => (
            <div key={s.id} className="card p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-navy-800 to-brand-700 text-sm font-bold text-white">
                  {initials(s.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{s.name}</p>
                  <p className="truncate text-xs capitalize text-slate-400">{s.role}</p>
                </div>
              </div>
              <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <p>{s.email ?? "—"}</p>
                <p>{s.phone ?? "—"}</p>
                <p>Joined {formatDate(s.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
