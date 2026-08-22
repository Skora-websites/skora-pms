"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { cancelPatientAppointment } from "./actions";

/** Cancel an upcoming appointment (patient-facing). */
export function CancelAppointmentButton({ appointmentId }: { appointmentId: number }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleCancel() {
    if (!window.confirm("Cancel this appointment? This cannot be undone.")) return;
    setBusy(true);
    await cancelPatientAppointment(appointmentId);
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleCancel}
      disabled={busy}
      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
    >
      <XCircle className="h-3.5 w-3.5" />
      {busy ? "Cancelling…" : "Cancel"}
    </button>
  );
}