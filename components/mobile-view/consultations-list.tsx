"use client";

import Link from "next/link";
import { FileDown } from "lucide-react";
import { StatusBadge } from "@/components/ui/dashboard-ui";
import { formatDate } from "@/lib/utils";
import { consultationDetailPath, type Shell } from "@/lib/auth/shell-paths";

type C = {
  id: number;
  consultationDate: Date | null;
  diagnosisNote: string | null;
  followUpDate: string | null;
  followUpStatus: string | null;
  patientName: string;
  patientPhone: string | null;
  patientRegistrationId: string | null;
  patientId: number;
  appointmentId: number | null;
};

/**
 * Mobile-only consultation list (< sm, hidden ≥ sm).
 * One card per consultation — no table scroll.
 *
 * `shell` decides where "View" goes: this component is rendered by BOTH
 * /admin/consultations and /doctor/consultations, and a hardcoded /doctor path
 * bounced owners out of their own panel (audit H6).
 */
export function ConsultationList({
  consultations,
  shell,
}: {
  consultations: C[];
  shell: Shell;
}) {
  const detailHref = (appointmentId: number) => consultationDetailPath(shell, appointmentId);
  return (
    <div className="space-y-3 sm:hidden">
      {consultations.map((c) => {
        // Narrow once so the Link href is never a nullable value.
        const viewHref = c.appointmentId ? detailHref(c.appointmentId) : null;
        return (
        <div key={c.id} className="card p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{c.patientName}</p>
              <p className="truncate text-xs text-slate-400">
                {c.patientPhone ?? c.patientRegistrationId ?? `#${c.patientId}`}
              </p>
            </div>
            <StatusBadge status={c.followUpStatus} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-slate-400">Date</p>
              <p className="font-medium text-slate-700">{formatDate(c.consultationDate)}</p>
            </div>
            <div>
              <p className="text-slate-400">Follow-up</p>
              <p className="font-medium text-slate-700">{c.followUpDate ?? "—"}</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            {c.diagnosisNote ?? "No diagnosis recorded"}
          </p>
          <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <a
              href={`/api/prescriptions/${c.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-brand-300 hover:text-brand-800"
            >
              <FileDown className="h-3.5 w-3.5" /> PDF
            </a>
            {viewHref && (
              <Link
                href={viewHref}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-brand-300 hover:text-brand-800"
              >
                View
              </Link>
            )}
          </div>
        </div>
        );
      })}
    </div>
  );
}