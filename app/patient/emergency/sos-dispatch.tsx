"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Loader2, MapPin, Phone, X } from "lucide-react";
import { triggerSos, cancelSos } from "@/lib/dispatch/actions";
import { SosLiveMap } from "@/components/sos/sos-live-map";

type StatusPayload = {
  id: number;
  status: string;
  complaint: string | null;
  createdAt: string | null;
  patientLatitude: string;
  patientLongitude: string;
  doctor: {
    name: string;
    phone: string | null;
    liveLatitude: string | null;
    liveLongitude: string | null;
    lastSeenAt: string | null;
    caseStatus: string | null;
  } | null;
};

/**
 * Uber-style SOS dispatch:
 * - A single big pulsing red button — no form.
 * - Pressing it auto-locates the patient and triggers the SOS.
 * - After dispatch, shows a live map with the patient marker and the
 *   doctor marker that moves in real time as the doctor drives over.
 */
export function SosDispatchButton({ initialRequestId = null }: { initialRequestId?: number | null }) {
  const [locating, setLocating] = useState(false);
  const [pending, startTransition] = useTransition();
  const [requestId, setRequestId] = useState<number | null>(initialRequestId);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [useGps, setUseGps] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // formRef reads CURRENT DOM input values at click time (no React state
  // batching races between the toggle/fill and the SOS tap).
  const formRef = useRef<HTMLFormElement>(null);
  const gpsModeRef = useRef(true);

  const getPosition = useCallback((): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Location not supported on this device."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => reject(new Error("Could not get your location. Please enter coordinates.")),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, []);

  const toggleMode = () => {
    const next = !gpsModeRef.current;
    gpsModeRef.current = next;
    setUseGps(next);
  };

  const fireSos = () => {
    setError(null);
    startTransition(async () => {
      try {
        let lat: number;
        let lng: number;
        if (gpsModeRef.current) {
          setLocating(true);
          const pos = await getPosition();
          lat = pos.lat;
          lng = pos.lng;
          setLocating(false);
        } else {
          // Read from the DOM directly via form data — no stale state races.
          if (!formRef.current) { setError("Form not ready."); return; }
          const fd = new FormData(formRef.current);
          const rawLat = fd.get("latitude") as string;
          const rawLng = fd.get("longitude") as string;
          lat = Number(rawLat ?? "");
          lng = Number(rawLng ?? "");
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            setError("Enter valid coordinates.");
            return;
          }
        }
        const fd = new FormData();
        fd.set("latitude", String(lat));
        fd.set("longitude", String(lng));
        fd.set("radius_km", "10");
        const res = await triggerSos({ error: null }, fd);
        if (res.error) setError(res.error);
        else if (res.requestId) setRequestId(res.requestId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not determine your location.");
        setLocating(false);
      }
    });
  };

  // Poll status while a request is active.
  useEffect(() => {
    if (!requestId) return;
    const tick = async () => {
      try {
        const r = await fetch(`/api/patient/sos/status/${requestId}`, { credentials: "include" });
        if (r.ok) setStatus((await r.json()) as StatusPayload);
      } catch {
        /* retry */
      }
    };
    tick();
    pollRef.current = setInterval(tick, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [requestId]);

  // Live map view while waiting / accepted.
  if (requestId && status) {
    const pLat = Number(status.patientLatitude);
    const pLng = Number(status.patientLongitude);
    const dLat = status.doctor?.liveLatitude ? Number(status.doctor.liveLatitude) : null;
    const dLng = status.doctor?.liveLongitude ? Number(status.doctor.liveLongitude) : null;

    if (status.status === "pending") {
      return (
        <div className="overflow-hidden rounded-3xl border-2 border-red-200 bg-white shadow-lg">
          <div className="space-y-3 p-5">
            <div className="rounded-2xl bg-amber-50 p-4 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-amber-600" />
              <p className="mt-2 font-bold text-amber-800">Finding nearby doctors…</p>
              <p className="text-xs text-amber-700">Alerting on-duty doctors near you.</p>
            </div>
            <SosLiveMap patientLat={pLat} patientLng={pLng} height={240} />
            <button
              onClick={async () => {
                setCancelling(true);
                await cancelSos(requestId);
                setRequestId(null);
                setStatus(null);
                setCancelling(false);
              }}
              disabled={cancelling}
              className="btn-secondary w-full justify-center py-2 text-xs"
            >
              <X className="h-4 w-4" /> {cancelling ? "Cancelling…" : "Cancel request"}
            </button>
          </div>
        </div>
      );
    }

    if (status.status === "accepted" && status.doctor) {
      return (
        <div className="overflow-hidden rounded-3xl border-2 border-emerald-300 bg-white shadow-lg">
          <div className="p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl">🚑</span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-bold text-slate-900">Dr. {status.doctor.name} is on the way</p>
                <p className="text-xs text-slate-500">
                  {dLat != null ? "En route — live tracking" : "Help has been dispatched"}
                </p>
              </div>
              {status.doctor.phone && (
                <a href={`tel:${status.doctor.phone}`} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800">
                  <Phone className="h-4 w-4" /> Call
                </a>
              )}
            </div>
          </div>
          <SosLiveMap patientLat={pLat} patientLng={pLng} doctorLat={dLat} doctorLng={dLng} height={300} />
          <div className="p-4 text-center text-xs text-slate-500">
            {dLat != null ? "Tracking your doctor live" : "Waiting for the doctor to start moving…"}
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-3xl border-2 border-red-200 bg-white p-6 text-center shadow-lg">
        <p className="font-semibold text-slate-700">
          {status.status === "expired" ? "No doctor was available nearby." : "This request is no longer active."}
        </p>
        <p className="mt-1 text-sm text-slate-500">Please call emergency services or try again.</p>
        <button onClick={() => { setRequestId(null); setStatus(null); }} className="btn-primary mt-4 justify-center">
          New SOS
        </button>
      </div>
    );
  }

  // Idle state — the big Uber-style SOS button.
  return (
    <div className="overflow-hidden rounded-3xl border-2 border-red-200 bg-white shadow-lg">
      <div className="bg-gradient-to-br from-red-600 via-rose-600 to-red-700 px-6 py-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-red-100">Emergency SOS</p>
        <button
          onClick={fireSos}
          disabled={pending || locating}
          className="group relative mx-auto mt-6 flex h-44 w-44 items-center justify-center"
          aria-label="Send SOS"
        >
          {/* Pulsing rings */}
          <span className="absolute inset-0 animate-ping rounded-full bg-red-400/40" />
          <span className="absolute inset-3 animate-pulse rounded-full bg-red-500/40" />
          <span className="relative flex h-32 w-32 items-center justify-center rounded-full border-4 border-red-300 bg-gradient-to-b from-red-500 to-red-700 text-white shadow-2xl transition group-active:scale-95">
            {pending || locating ? (
              <Loader2 className="h-10 w-10 animate-spin" />
            ) : (
              <span className="text-center">
                <span className="block font-display text-lg font-extrabold leading-tight">SOS</span>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-red-200">Tap for help</span>
              </span>
            )}
          </span>
        </button>
        <p className="mt-4 text-xs text-red-100">
          {locating ? "Getting your location…" : pending ? "Sending your request…" : "Tap the button — we&apos;ll find nearby doctors instantly."}
        </p>
      </div>

      <div className="space-y-3 p-5">
        {/* Location source */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500">YOUR LOCATION</p>
          <button
            type="button"
            onClick={toggleMode}
            className="text-xs font-semibold text-brand-700 hover:text-brand-600"
          >
            {useGps ? "Use manual coords" : "Use GPS"}
          </button>
        </div>
        {useGps ? (
          <button
            type="button"
            onClick={() => {
              setError(null);
              getPosition()
                .then(() => setError("Location ready — tap SOS."))
                .catch((e) => setError(e.message));
            }}
            className="btn-secondary w-full justify-center py-2 text-xs"
          >
            <MapPin className="h-4 w-4" /> Use my current location
          </button>
        ) : (
          <form ref={formRef} className="grid grid-cols-2 gap-3">
            <input name="latitude" placeholder="Latitude" className="input" inputMode="decimal" />
            <input name="longitude" placeholder="Longitude" className="input" inputMode="decimal" />
          </form>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
