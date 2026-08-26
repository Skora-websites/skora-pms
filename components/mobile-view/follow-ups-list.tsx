"use client";

import { FollowUpActions } from "@/app/doctor/follow-ups/follow-up-actions";
import { StatusBadge } from "@/components/ui/dashboard-ui";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type F = {
  id: number;
  followUpDate: string | null;
  followUpStatus: string | null;
  consultationDate: Date | null;
  patientName: string;
  patientPhone: string | null;
};

/**
 * Mobile-only follow-up list (< sm, hidden ≥ sm).
 * One card per follow-up — no table scroll.
 */
export function FollowUpList({
  pending,
  done,
}: {
  pending: F[];
  done: F[];
}) {
  const Card = ({ f, isPending }: { f: F; isPending: boolean }) => (
    <div className={cn("card p-4", !isPending && "opacity-60")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{f.patientName}</p>
          <p className="truncate text-xs text-slate-400">{f.patientPhone}</p>
        </div>
        <StatusBadge status={f.followUpStatus ?? "pending"} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-slate-400">Follow-up</p>
          <p className="font-semibold text-brand-800">{f.followUpDate}</p>
        </div>
        <div>
          <p className="text-slate-400">Last visit</p>
          <p className="font-medium text-slate-700">{formatDate(f.consultationDate)}</p>
        </div>
      </div>
      {isPending && (
        <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
          <FollowUpActions consultationId={f.id} status={f.followUpStatus ?? "pending"} />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-3 sm:hidden">
      {pending.map((f) => <Card key={f.id} f={f} isPending />)}
      {done.map((f) => <Card key={f.id} f={f} isPending={false} />)}
    </div>
  );
}
