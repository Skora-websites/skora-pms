import type { Metadata } from "next";
import { PhoneCall } from "lucide-react";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAdminTier } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { getFollowUps, getFollowUpReminders } from "@/lib/queries/doctor";
import { PageHeader, EmptyState, StatusBadge, QuickContactActions } from "@/components/ui/dashboard-ui";
import { formatDate, todayStr } from "@/lib/utils";
import { NewFollowUpForm, ReminderActions } from "@/app/doctor/follow-ups/follow-up-forms";

export const metadata: Metadata = { title: "Follow Ups · Business" };

/** Patients across ALL scoped doctors (unlike single-owner getDoctorPatients). */
async function getScopePatients(doctorIds: number[]) {
  if (doctorIds.length === 0) return [];
  return db
    .select({ id: users.id, name: users.name, phone: users.phone })
    .from(users)
    .where(and(eq(users.role, "patient"), inArray(users.referenceRoleId, doctorIds)))
    .orderBy(desc(users.createdAt));
}

export default async function AdminFollowUpsPage() {
  await requireAdminTier("/admin/follow-ups");
  const scope = await getBusinessScope();
  const [followUps, reminders] = await Promise.all([
    getFollowUps(scope.doctorIds),
    getFollowUpReminders(scope.doctorIds),
  ]);
  // The New Follow-up form needs the whole business's patient list, not just
  // the anchor doctor's (getDoctorPatients is single-owner scoped; the admin
  // tier fans out across all scoped doctors).
  const patients = await getScopePatients(scope.doctorIds);

  const today = todayStr();
  const pending = followUps.filter((f) => f.followUpStatus === "pending");
  const done = followUps.filter((f) => f.followUpStatus !== "pending");
  const pendingReminders = reminders.filter((r) => (r.status ?? "pending") === "pending");
  const doneReminders = reminders.filter((r) => (r.status ?? "pending") !== "pending");
  const overdueCount = pending.filter((f) => (f.followUpDate ?? "") < today).length
    + pendingReminders.filter((r) => r.followUpDate < today).length;

  return (
    <div>
      <PageHeader
        title="Follow ups"
        subtitle={`${pending.length + pendingReminders.length} pending across your business${overdueCount > 0 ? ` · ${overdueCount} overdue` : ""}`}
        action={<NewFollowUpForm patients={patients.map((p) => ({ id: p.id, name: p.name, phone: p.phone }))} />}
      />

      {followUps.length === 0 && reminders.length === 0 ? (
        <EmptyState
          icon={PhoneCall}
          title="No follow-ups scheduled"
          description="Follow-ups set during consultations at your clinics, or scheduled as reminders, will appear here."
        />
      ) : (
        <div className="space-y-6">
          {[
            { title: "Consultation follow-ups · Pending", rows: pending },
            { title: "Consultation follow-ups · Resolved", rows: done },
          ].map((group) =>
            group.rows.length === 0 ? null : (
              <div key={group.title} className="card overflow-hidden">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">
                    {group.title} · {group.rows.length}
                  </h2>
                </div>
                <div className="divide-y divide-slate-50">
                  {group.rows.map((f) => (
                    <div key={f.id} className="flex items-center justify-between gap-3 px-6 py-3.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">
                          {f.patientName} · {formatDate(f.followUpDate)}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {f.followUpComment ?? "No notes"}
                        </p>
                        <div className="mt-1.5"><QuickContactActions phone={f.patientPhone} size="xs" /></div>
                      </div>
                      <StatusBadge status={f.followUpStatus} />
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {reminders.length > 0 && (
            <div className="card overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">
                  Scheduled reminders · {reminders.length}
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">Created from the Follow-ups page.</p>
              </div>
              <div className="divide-y divide-slate-50">
                {[...pendingReminders, ...doneReminders].map((r) => (
                  <div key={r.id} className={`flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 ${(r.status ?? "pending") !== "pending" ? "opacity-60" : ""}`}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        {r.patientName} · {formatDate(r.followUpDate)}
                      </p>
                      <p className="truncate text-xs text-slate-400">{r.note ?? "No notes"}</p>
                      <div className="mt-1.5"><QuickContactActions phone={r.patientPhone} size="xs" /></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={r.status ?? "pending"} />
                      <ReminderActions reminderId={r.id} status={r.status ?? "pending"} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
