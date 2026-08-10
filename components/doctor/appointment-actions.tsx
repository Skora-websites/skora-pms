"use client";

import { useTransition } from "react";
import { Check, XCircle, ClipboardList } from "lucide-react";
import { updateAppointmentStatus } from "@/app/doctor/actions";
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

  if (status === "cancelled" || status === "completed") return null;

  return (
    <div className="flex items-center gap-1.5">
      {status !== "confirmed" && (
        <button
          disabled={pending}
          onClick={() => act("confirmed")}
          title="Confirm"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent-200 text-accent-700 transition-colors hover:bg-accent-50 disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
        </button>
      )}
      {status !== "completed" && status !== "pending_consent" && (
        <Link
          href={`/doctor/consultations/${appointmentId}`}
          title="Start consultation"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-200 text-brand-800 transition-colors hover:bg-brand-50"
        >
          <ClipboardList className="h-4 w-4" />
        </Link>
      )}
      <button
        disabled={pending}
        onClick={() => act("cancelled")}
        title="Cancel"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
      >
        <XCircle className="h-4 w-4" />
      </button>
    </div>
  );
}
