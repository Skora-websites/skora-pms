"use client";

import { AppointmentRowActions } from "@/components/doctor/appointment-actions";
import { StatusBadge } from "@/components/ui/dashboard-ui";
import { formatDate } from "@/lib/utils";

type Appt = {
  id: number;
  patientName: string;
  patientPhone: string | null;
  mobileNumber: string | null;
  date: string;
  time: string;
  caseType: string;
  status: string;
};

/**
 * Mobile-only appointment list (rendered < sm, hidden ≥ sm).
 * One card per appointment — no horizontal table scroll.
 */
export function AppointmentList({ appointments }: { appointments: Appt[] }) {
  return (
    <div className="space-y-3 sm:hidden">
      {appointments.map((a) => (
        <div key={a.id} className="card p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{a.patientName}</p>
              <p className="truncate text-xs text-slate-400">
                {a.mobileNumber ?? a.patientPhone ?? ""}
              </p>
            </div>
            <StatusBadge status={a.status} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-slate-400">Date</p>
              <p className="font-semibold text-slate-800">{formatDate(a.date)}</p>
            </div>
            <div>
              <p className="text-slate-400">Time</p>
              <p className="font-semibold text-slate-800">{a.time}</p>
            </div>
            <div>
              <p className="text-slate-400">Type</p>
              <p className="capitalize text-slate-800">{a.caseType.replace(/_/g, " ")}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-end border-t border-slate-100 pt-3">
            <AppointmentRowActions appointmentId={a.id} status={a.status} />
          </div>
        </div>
      ))}
    </div>
  );
}
