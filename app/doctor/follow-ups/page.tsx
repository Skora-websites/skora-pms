import type { Metadata } from "next";
import { PhoneCall } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getFollowUps } from "@/lib/queries/doctor";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui/dashboard-ui";
import { FollowUpActions } from "./follow-up-actions";
import { FollowUpList } from "@/components/mobile-view/follow-ups-list";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Follow Ups · Doctor" };

export default async function FollowUpsPage() {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
  const followUps = await getFollowUps(doctorId);

  const pending = followUps.filter((f) => f.followUpStatus === "pending");
  const done = followUps.filter((f) => f.followUpStatus !== "pending");

  return (
    <div>
      <PageHeader
        title="Follow ups"
        subtitle={`${pending.length} pending follow-up${pending.length === 1 ? "" : "s"} scheduled`}
      />

      {followUps.length === 0 ? (
        <EmptyState
          icon={PhoneCall}
          title="No follow-ups scheduled"
          description="Follow-ups appear here when you set a follow-up date during a consultation."
        />
      ) : (
        <div className="space-y-6">
          {/* Mobile: card list */}
          <FollowUpList pending={pending} done={done} />
          {/* Desktop: table */}
          <div className="hidden sm:block">
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Follow-up date</th>
                    <th>Last consultation</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <p className="font-semibold text-slate-900">{f.patientName}</p>
                        <p className="text-xs text-slate-400">{f.patientPhone}</p>
                      </td>
                      <td className="font-semibold text-brand-800">{f.followUpDate}</td>
                      <td>{formatDate(f.consultationDate)}</td>
                      <td><StatusBadge status={f.followUpStatus ?? "pending"} /></td>
                      <td className="text-right">
                        <FollowUpActions consultationId={f.id} status={f.followUpStatus ?? "pending"} />
                      </td>
                    </tr>
                  ))}
                  {done.map((f) => (
                    <tr key={f.id} className="opacity-60">
                      <td>
                        <p className="font-semibold text-slate-900">{f.patientName}</p>
                        <p className="text-xs text-slate-400">{f.patientPhone}</p>
                      </td>
                      <td>{f.followUpDate}</td>
                      <td>{formatDate(f.consultationDate)}</td>
                      <td><StatusBadge status={f.followUpStatus ?? "pending"} /></td>
                      <td />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
