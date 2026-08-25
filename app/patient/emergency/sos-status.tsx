"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Phone } from "lucide-react";
import { cancelSos } from "@/lib/dispatch/actions";

type Status = {
  id: number;
  status: string;
  complaint: string | null;
  createdAt: string | null;
  doctor: { name: string; phone: string | null } | null;
};

/**
 * Live status tracker for the patient's SOS request.
 * Polls every 3s (ownership-checked server-side).
 */
export function SosStatusTracker({ requestId }: { requestId: number }) {
  const [data, setData] = useState<Status | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let stopped = false;
    const tick = async () => {
      try {
        const r = await fetch(`/api/patient/sos/status/${requestId}`, { credentials: "include" });
        if (r.ok) {
          const j: Status = await r.json();
          if (!stopped) setData(j);
        }
      } catch {
        /* retry next tick */
      }
    };
    tick();
    const t = setInterval(tick, 3000);
    return () => {
      stopped = true;
      clearInterval(t);
    };
  }, [requestId]);

  if (!data) {
    return (
      <div className="card flex items-center gap-3 p-6">
        <Loader2 className="h-5 w-5 animate-spin text-brand-700" />
        <span className="text-sm text-slate-600">Checking request status…</span>
      </div>
    );
  }

  if (data.status === "pending") {
    return (
      <div className="card space-y-3 p-6">
        <p className="flex items-center gap-2 font-semibold text-amber-700">
          <Loader2 className="h-4 w-4 animate-spin" /> Finding nearby doctors…
        </p>
        <p className="text-sm text-slate-500">Stay calm. We&apos;re alerting on-duty doctors near you.</p>
        <button
          onClick={async () => {
            setCancelling(true);
            await cancelSos(requestId);
          }}
          disabled={cancelling}
          className="btn-secondary w-full justify-center py-2 text-xs"
        >
          {cancelling ? "Cancelling…" : "Cancel request"}
        </button>
      </div>
    );
  }

  if (data.status === "accepted" && data.doctor) {
    return (
      <div className="card space-y-4 p-6">
        <p className="flex items-center gap-2 font-bold text-emerald-700">
          <CheckCircle2 className="h-5 w-5" /> Doctor on the way!
        </p>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="font-display text-lg font-bold text-slate-900">Dr. {data.doctor.name}</p>
          {data.doctor.phone && (
            <a
              href={`tel:${data.doctor.phone}`}
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              <Phone className="h-4 w-4" /> Call {data.doctor.phone}
            </a>
          )}
        </div>
        <p className="text-xs text-slate-500">Help has been dispatched to your location.</p>
      </div>
    );
  }

  if (data.status === "completed") {
    return (
      <div className="card space-y-3 p-6">
        <p className="flex items-center gap-2 font-bold text-emerald-700">
          <CheckCircle2 className="h-5 w-5" /> Emergency resolved
        </p>
        <p className="text-sm text-slate-500">The response has been completed. Stay safe.</p>
      </div>
    );
  }

  return (
    <div className="card space-y-3 p-6">
      <p className="font-semibold text-slate-700">
        {data.status === "expired"
          ? "No doctor was available nearby."
          : "This request is no longer active."}
      </p>
      <p className="text-sm text-slate-500">Please call emergency services or try again.</p>
    </div>
  );
}
