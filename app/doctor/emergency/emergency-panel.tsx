"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, MapPin, XCircle } from "lucide-react";
import { acceptSos, declineSos, setDoctorOnDuty, updateDoctorLocation } from "@/lib/dispatch/actions";

type Offer = {
  id: number;
  requestId: number;
  distanceKm: string | null;
  complaint: string | null;
  patient: string;
  createdAt: Date | null;
};

export function EmergencyPanel({
  initialOffers,
  initialOnDuty,
}: {
  initialOffers: Offer[];
  initialOnDuty: boolean;
}) {
  const [offers, setOffers] = useState<Offer[]>(initialOffers);
  const [onDuty, setOnDuty] = useState(initialOnDuty);
  const [busy, setBusy] = useState(false);
  const [activeCase, setActiveCase] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const shareTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live SSE subscription when on duty.
  useEffect(() => {
    if (!onDuty) return;
    const es = new EventSource("/api/doctor/sos/stream");
    es.onmessage = (e) => {
      try {
        const ev = JSON.parse(e.data);
        if (ev.type === "sos:new") {
          setOffers((prev) =>
            prev.some((o) => o.requestId === ev.requestId)
              ? prev
              : [
                  ...prev,
                  {
                    id: ev.requestId,
                    requestId: ev.requestId,
                    distanceKm: ev.distanceKm,
                    complaint: ev.complaint,
                    patient: ev.patient,
                    createdAt: new Date(),
                  },
                ]
          );
        } else if (ev.type === "sos:taken" || ev.type === "sos:cancelled") {
          setOffers((prev) => prev.filter((o) => o.requestId !== ev.requestId));
        }
      } catch {
        /* ignore malformed frames */
      }
    };
    return () => es.close();
  }, [onDuty]);

  // When an active case exists, share live GPS every 5s (Uber-style tracking).
  useEffect(() => {
    if (activeCase == null) return;
    if (!navigator.geolocation) return;
    const send = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          void updateDoctorLocation(activeCase, pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          /* ignore — retry next tick */
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    };
    send();
    shareTimer.current = setInterval(send, 5000);
    return () => {
      if (shareTimer.current) clearInterval(shareTimer.current);
    };
  }, [activeCase]);

  const toggleDuty = () => {
    setBusy(true);
    startTransition(async () => {
      await setDoctorOnDuty(!onDuty);
      setOnDuty(!onDuty);
      setBusy(false);
      router.refresh();
    });
  };

  const accept = (requestId: number) => {
    setBusy(true);
    startTransition(async () => {
      const res = await acceptSos(requestId);
      if (res.error) alert(res.error);
      else {
        setOffers((prev) => prev.filter((o) => o.requestId !== requestId));
        setActiveCase(requestId);
      }
      setBusy(false);
      router.refresh();
    });
  };

  const decline = (requestId: number) => {
    setBusy(true);
    startTransition(async () => {
      await declineSos(requestId);
      setOffers((prev) => prev.filter((o) => o.requestId !== requestId));
      setBusy(false);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* Active case banner — sharing live location */}
      {activeCase != null && (
        <div className="card flex items-center justify-between border-emerald-200 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-lg">🚑</span>
            <div>
              <p className="font-bold text-emerald-700">En route — sharing live location</p>
              <p className="text-xs text-slate-500">Your GPS position is visible to the patient (updated every 5s).</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-600" /> LIVE
          </span>
        </div>
      )}
      {/* On-duty toggle */}
      <div className="card flex items-center justify-between p-6">
        <div>
          <h2 className="font-display text-base font-bold text-slate-900">On-duty status</h2>
          <p className="text-xs text-slate-500">Only on-duty doctors receive emergency alerts.</p>
        </div>
        <button
          onClick={toggleDuty}
          disabled={busy}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition ${
            onDuty ? "bg-red-600 text-white" : "bg-slate-200 text-slate-600"
          }`}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : onDuty ? "On Duty" : "Go On Duty"}
        </button>
      </div>

      {/* Incoming requests */}
      {offers.length === 0 ? (
        <div className="card p-10 text-center">
          <MapPin className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">
            {onDuty
              ? "No emergency requests right now. You'll see them here live."
              : "Go on duty to receive emergency requests."}
          </p>
        </div>
      ) : (
        offers.map((o) => (
          <div
            key={o.requestId}
            className="card flex flex-wrap items-center justify-between gap-4 border-red-200 p-6"
          >
            <div>
              <p className="flex items-center gap-2 font-bold text-red-700">🚨 Emergency request</p>
              <p className="mt-1 text-sm text-slate-600">
                {o.patient} · {o.distanceKm ? `${o.distanceKm} km away` : "distance unknown"}
              </p>
              {o.complaint && <p className="mt-1 text-xs text-slate-500">{o.complaint}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => decline(o.requestId)}
                disabled={busy}
                className="btn-secondary !py-2 text-xs"
              >
                <XCircle className="h-4 w-4" /> Decline
              </button>
              <button
                onClick={() => accept(o.requestId)}
                disabled={busy}
                className="btn-danger !py-2 text-xs"
              >
                <CheckCircle2 className="h-4 w-4" /> Accept
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
