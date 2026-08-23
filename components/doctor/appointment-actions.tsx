"use client";

import { useTransition } from "react";
import {
  Check,
  XCircle,
  ClipboardList,
  Pencil,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { updateAppointmentStatus } from "@/app/doctor/actions";
import { cancelAppointment, completeAppointment, deleteAppointment } from "@/app/doctor/appointments/actions";
import Link from "next/link";

export function AppointmentRowActions({
  appointmentId,
  status,
}: {
  appointmentId: number;
  status: string;
}) {
  const [pending, startTransition] = useTransition();

  const act = (next: string) =>
    startTransition(() => updateAppointmentStatus(appointmentId, next));

  const cancel = () =>
    startTransition(async () => {
      await cancelAppointment(appointmentId);
    });

  const complete = () =>
    startTransition(async () => {
      await completeAppointment(appointmentId);
    });

  const remove = () => {
    if (!window.confirm("Delete this appointment permanently?")) return;
    startTransition(async () => {
      await deleteAppointment(appointmentId);
    });
  };

  return (
    <div className="flex items-center justify-end gap-1.5">
      {status !== "confirmed" && status !== "cancelled" && status !== "completed" && (
        <button
          disabled={pending}
          onClick={() => act("confirmed")}
          title="Confirm"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent-200 text-accent-700 transition-colors hover:bg-accent-50 disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
        </button>
      )}

      {status === "completed" && (
        <span className="flex h-8 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> Done
        </span>
      )}

      {status !== "completed" && status !== "cancelled" && status !== "pending_consent" && (
        <Link
          href={`/doctor/consultations/${appointmentId}`}
          title="Start consultation"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-200 text-brand-800 transition-colors hover:bg-brand-50"
        >
          <ClipboardList className="h-4 w-4" />
        </Link>
      )}

      {status !== "cancelled" && status !== "completed" && (
        <Link
          href={`/doctor/appointments/${appointmentId}/edit`}
          title="Edit"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
        >
          <Pencil className="h-4 w-4" />
        </Link>
      )}

      {status !== "cancelled" && status !== "completed" && status !== "pending_consent" && (
        <button
          disabled={pending}
          onClick={complete}
          title="Mark completed"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50"
        >
          <CheckCircle2 className="h-4 w-4" />
        </button>
      )}

      {status !== "completed" && status !== "pending_consent" && (
        <button
          disabled={pending}
          onClick={cancel}
          title="Cancel"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}

      {status !== "completed" && (
        <button
          disabled={pending}
          onClick={remove}
          title="Delete"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

