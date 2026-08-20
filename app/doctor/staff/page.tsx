import type { Metadata } from "next";
import { Users } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { users, roles, modelHasRoles } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { PageHeader, EmptyState } from "@/components/ui/dashboard-ui";
import { initials, formatDate } from "@/lib/utils";
import { StaffForm } from "./staff-form";
import { StaffActions } from "./staff-actions";
import { AttendancePanel } from "./attendance-panel";

export const metadata: Metadata = { title: "My Staff · Doctor" };

const USER_MODEL = "App\\Models\\User";

export default async function StaffPage() {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;

  const [staff, practiceRoles] = await Promise.all([
    db
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
      .where(and(eq(users.referenceRoleId, doctorId), eq(users.role, "receptionist")))
      .orderBy(users.createdAt),
    db.select({ id: roles.id, name: roles.name }).from(roles).where(eq(roles.doctorId, doctorId)),
  ]);

  // Role name per staff member (first practice role assigned).
  const roleRows = await db
    .select({ modelId: modelHasRoles.modelId, roleId: modelHasRoles.roleId })
    .from(modelHasRoles)
    .where(eq(modelHasRoles.modelType, USER_MODEL));
  const roleNameById = new Map(practiceRoles.map((r) => [r.id, r.name]));
  const roleOfStaff = new Map<number, string>();
  for (const rr of roleRows) {
    if (!roleOfStaff.has(rr.modelId)) {
      const name = roleNameById.get(rr.roleId);
      if (name) roleOfStaff.set(rr.modelId, name);
    }
  }

  return (
    <div>
      <PageHeader
        title="My staff"
        subtitle="Team members linked to your practice"
        action={<StaffForm practiceRoles={practiceRoles} />}
      />

      {staff.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No staff members yet"
          description="Add receptionists or other staff — they log in with their own account and get the permissions of their role."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {staff.map((s) => (
            <div key={s.id} className="card p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-navy-800 to-brand-700 text-sm font-bold text-white">
                  {initials(s.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{s.name}</p>
                  <p className="truncate text-xs capitalize text-slate-400">
                    {roleOfStaff.get(s.id) ?? s.role}
                  </p>
                </div>
                <StaffActions staff={s} practiceRoles={practiceRoles} />
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

      <div className="mt-10">
        <AttendancePanel staff={staff} />
      </div>
    </div>
  );
}