import type { Metadata } from "next";
import { PhoneCall } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import {
  getFollowUps,
  getFollowUpReminders,
  getDoctorPatients,
  resolvePracticeDoctorId,
} from "@/lib/queries/doctor";
import { listDoctorIdsFor } from "@/lib/queries/clinic";
import { PageHeader, EmptyState, StatusBadge, QuickContactActions } from "@/components/ui/dashboard-ui";
import { FollowUpList } from "@/components/mobile-view/follow-ups-list";
import { formatDate, formatDateTime, todayStr } from "@/lib/utils";
import { NewFollowUpForm, FollowUpFlowActions, ReminderActions } from "./follow-up-forms";

export const metadata: Metadata = { title: "Follow Ups · Doctor" };

export default async function FollowUpsPage() {
  const user = await requireRole(["doctor", "receptionist"]);
  const doctorId = resolvePracticeDoctorId(user);
  // Owner doctors + receptionists see the practice's follow-ups; a member
  // doctor sees strictly their own patients' follow-ups.
  const doctorIds = await listDoctorIdsFor(user, doctorId);
  const [followUps, reminders, patients] = await Promise.all([
    getFollowUps(doctorIds),
    getFollowUpReminders(doctorIds),
    getDoctorPatients(doctorId),
  ]);

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
        subtitle={`${pending.length + pendingReminders.length} pending follow-up${pending.length + pendingReminders.length === 1 ? "" : "s"} scheduled${overdueCount > 0 ? ` · ${overdueCount} overdue` : ""}`}
        action={<NewFollowUpForm patients={patients.map((p) => ({ id: p.id, name: p.name, phone: p.phone }))} />}
      />

      {followUps.length === 0 && reminders.length === 0 ? (
        <EmptyState
          icon={PhoneCall}
          title="No follow-ups scheduled"
          description="Follow-ups appear here when you set a follow-up date during a consultation, or use “New follow-up” to schedule a reminder."
        />
      ) : (
        <div className="space-y-6">
          {/* ── Consultation follow-ups ── */}
          {followUps.length > 0 && (
            <>
              {/* Mobile: card list */}
              <FollowUpList pending={pending} done={done} />
              {/* Desktop: table */}
              <div className="hidden sm:block">
                <div className="table-shell">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Patient</th>
                        <th>Contact</th>
                        <th>Follow-up date</th>
                        <th>Last consultation</th>
                        <th>Note</th>
                        <th>Status</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pending.map((f) => (
                        <tr key={f.id}>
                          <td>
                            <p className="font-semibold text-ink">{f.patientName}</p>
                          </td>
                          <td>
                            <p className="text-xs text-slate-400">{f.patientPhone ?? "—"}</p>
                            <div className="mt-1"><QuickContactActions phone={f.patientPhone} /></div>
                          </td>
                          <td className="font-semibold text-brand-800">
                            {f.followUpDate}
                            {(f.followUpDate ?? "") < today && (
                              <span className="ml-1.5 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">overdue</span>
                            )}
                          </td>
                          <td>{formatDate(f.consultationDate)}</td>
                          <td className="max-w-[200px] truncate text-xs text-slate-500" title={f.followUpComment ?? ""}>
                            {f.followUpComment ?? "—"}
                          </td>
                          <td><StatusBadge status={f.followUpStatus ?? "pending"} /></td>
                          <td className="text-right">
                            <FollowUpFlowActions
                              consultationId={f.id}
                              status={f.followUpStatus ?? "pending"}
                              patientPhone={f.patientPhone}
                            />
                          </td>
                        </tr>
                      ))}
                      {done.map((f) => (
                        <tr key={f.id} className="opacity-60">
                          <td>
                            <p className="font-semibold text-ink">{f.patientName}</p>
                          </td>
                          <td>
                            <p className="text-xs text-slate-400">{f.patientPhone ?? "—"}</p>
                            <div className="mt-1"><QuickContactActions phone={f.patientPhone} /></div>
                          </td>
                          <td>{f.followUpDate}</td>
                          <td>{formatDate(f.consultationDate)}</td>
                          <td className="max-w-[200px] truncate text-xs text-slate-500" title={f.followUpComment ?? ""}>
                            {f.followUpComment ?? "—"}
                          </td>
                          <td><StatusBadge status={f.followUpStatus ?? "pending"} /></td>
                          <td />
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── Scheduled reminders (from “New follow-up”) ── */}
          {reminders.length > 0 && (
            <div className="card overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">
                  Scheduled reminders · {reminders.length}
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">Created from this page — call-list reminders for registered patients.</p>
              </div>
              {/* Mobile: cards */}
              <div className="divide-y divide-slate-50 sm:hidden">
                {[...pendingReminders, ...doneReminders].map((r) => (
                  <div key={`m-${r.id}`} className={`px-4 py-3.5 ${(r.status ?? "pending") !== "pending" ? "opacity-60" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{r.patientName}</p>
                        <p className="truncate text-xs text-slate-400">{r.patientPhone ?? "—"}</p>
                      </div>
                      <StatusBadge status={r.status ?? "pending"} />
                    </div>
                    <div className="mt-2"><QuickContactActions phone={r.patientPhone} size="xs" /></div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-slate-400">Follow-up</p>
                        <p className="font-semibold text-brand-800">{r.followUpDate}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Created</p>
                        <p className="font-medium text-slate-700">{formatDateTime(r.createdAt)}</p>
                      </div>
                    </div>
                    {r.note && <p className="mt-2 rounded-lg bg-surface-subtle px-2.5 py-1.5 text-xs text-slate-600">{r.note}</p>}
                    {(r.status ?? "pending") === "pending" && (
                      <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
                        <ReminderActions reminderId={r.id} status={r.status ?? "pending"} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* Desktop: table */}
              <div className="hidden sm:block">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Contact</th>
                      <th>Follow-up date</th>
                      <th>Created</th>
                      <th>Note</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingReminders.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <p className="font-semibold text-ink">{r.patientName}</p>
                        </td>
                        <td>
                          <p className="text-xs text-slate-400">{r.patientPhone ?? "—"}</p>
                          <div className="mt-1"><QuickContactActions phone={r.patientPhone} /></div>
                        </td>
                        <td className="font-semibold text-brand-800">
                          {r.followUpDate}
                          {r.followUpDate < today && (
                            <span className="ml-1.5 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">overdue</span>
                          )}
                        </td>
                        <td>{formatDateTime(r.createdAt)}</td>
                        <td className="max-w-[220px] truncate text-xs text-slate-500" title={r.note ?? ""}>
                          {r.note ?? "—"}
                        </td>
                        <td><StatusBadge status={r.status ?? "pending"} /></td>
                        <td className="text-right">
                          <ReminderActions reminderId={r.id} status={r.status ?? "pending"} />
                        </td>
                      </tr>
                    ))}
                    {doneReminders.map((r) => (
                      <tr key={r.id} className="opacity-60">
                        <td>
                          <p className="font-semibold text-ink">{r.patientName}</p>
                        </td>
                        <td>
                          <p className="text-xs text-slate-400">{r.patientPhone ?? "—"}</p>
                          <div className="mt-1"><QuickContactActions phone={r.patientPhone} /></div>
                        </td>
                        <td>{r.followUpDate}</td>
                        <td>{formatDateTime(r.createdAt)}</td>
                        <td className="max-w-[220px] truncate text-xs text-slate-500" title={r.note ?? ""}>
                          {r.note ?? "—"}
                        </td>
                        <td><StatusBadge status={r.status ?? "pending"} /></td>
                        <td />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
