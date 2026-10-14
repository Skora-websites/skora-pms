"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, CheckCircle2, Loader2, MapPin, XCircle } from "lucide-react";
import {
  acceptSos,
  completeSos,
  declineSos,
  markSosArrived,
  setDoctorOnDuty,
  updateDoctorLocation,
  verifySosOtp,
} from "@/lib/dispatch/actions";
import { subscribeToPush, unsubscribeFromPush } from "@/lib/push/actions";
import { urlBase64ToUint8Array } from "@/lib/push/client-utils";
import { SosLiveMap } from "@/components/sos/sos-live-map";
import { SOS_FARE } from "@/lib/config";
import { useWakeLock } from "@/components/sos/use-wake-lock";
import { primeAlarmAudio, startSosAlarm, stopSosAlarm } from "@/components/sos/sos-alarm";

type Offer = {
  id: number;
  requestId: number;
  distanceKm: string | null;
  complaint: string | null;
  patient: string;
  createdAt: Date | null;
};

type ActiveCase = {
  sosRequestId: number;
  patientLatitude: string;
  patientLongitude: string;
  etaMinutes: number | null;
  distanceKm: string | null;
  arrivedAt: Date | null;
  otpVerifiedAt: Date | null;
};

export function EmergencyPanel({
  initialOffers,
  initialOnDuty,
  initialActiveCase,
}: {
  initialOffers: Offer[];
  initialOnDuty: boolean;
  /** The doctor's current open case, or null. Patient coordinates come with it. */
  initialActiveCase?: ActiveCase | null;
}) {
  const [offers, setOffers] = useState<Offer[]>(initialOffers);
  const [onDuty, setOnDuty] = useState(initialOnDuty);
  const [pushEnabled, setPushEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeCase, setActiveCase] = useState<number | null>(initialActiveCase?.sosRequestId ?? null);
  const [casePatient, setCasePatient] = useState<{ lat: string; lng: string } | null>(
    initialActiveCase
      ? { lat: initialActiveCase.patientLatitude, lng: initialActiveCase.patientLongitude }
      : null
  );
  const [ownPosition, setOwnPosition] = useState<{ lat: number; lng: number } | null>(null);
  // Arrival / identity / fare state — primed from the server case on mount so
  // a refresh mid-visit keeps the right step visible.
  const [arrived, setArrived] = useState<string | null>(initialActiveCase?.arrivedAt?.toISOString() ?? null);
  const [verified, setVerified] = useState<string | null>(
    initialActiveCase?.otpVerifiedAt?.toISOString() ?? null
  );
  const [otp, setOtp] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState("");
  const [eta, setEta] = useState<number | null>(initialActiveCase?.etaMinutes ?? null);
  const [fare, setFare] = useState<number | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const shareTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep the screen awake while an emergency case is active so the 5s GPS
  // sharing loop isn't killed by the phone sleeping (Android + iOS 16.4+).
  useWakeLock(activeCase != null);

  // Resolve push subscription state (permission + subscription) on mount.
  useEffect(() => {
    const check = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setPushEnabled(false);
        return;
      }
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      setPushEnabled(Notification.permission === "granted" && !!sub);
    };
    check().catch(() => setPushEnabled(false));
  }, []);

  /** Opt in/out of Web Push alerts for this device. */
  const togglePush = async () => {
    if (pushEnabled) {
      // Disable: unsubscribe this device.
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        if (sub) {
          await unsubscribeFromPush(sub.endpoint).catch(() => {});
          await sub.unsubscribe().catch(() => {});
        }
      } catch {
        /* ignore */
      }
      setPushEnabled(false);
      return;
    }
    // Enable: request permission + subscribe.
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return;
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub =
        existing ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""
          ),
        }));
      const json = sub.toJSON();
      await subscribeToPush(json.endpoint!, json.keys?.auth ?? "", json.keys?.p256dh ?? "");
      setPushEnabled(true);
      router.refresh();
    } catch {
      /* permission denied or subscribe failed — leave disabled */
    }
  };

  // Live SSE subscription when on duty.
  useEffect(() => {
    if (!onDuty) return;
    const es = new EventSource("/api/doctor/sos/stream");
    es.onmessage = (e) => {
      try {
        const ev = JSON.parse(e.data);
        if (ev.type === "sos:new") {
          startSosAlarm();
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

  // Stop the alarm when no offers remain (e.g. TTL expiry on the status poll).
  useEffect(() => {
    if (offers.length === 0) stopSosAlarm();
  }, [offers.length]);

  // When an active case exists, share live GPS every 5s (Uber-style tracking)
  // and track own position for the doctor-side map.
  useEffect(() => {
    if (activeCase == null) return;
    if (!navigator.geolocation) return;
    const send = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setOwnPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
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
    if (!onDuty) primeAlarmAudio(); // user gesture — unlocks iOS audio
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
    stopSosAlarm();
    startTransition(async () => {
      const res = await acceptSos(requestId);
      if (res.error) alert(res.error);
      else {
        setOffers((prev) => prev.filter((o) => o.requestId !== requestId));
        setActiveCase(requestId);
        // Plaintext arrival code + ETA exist only in this return value.
        if (res.otp) setOtp(res.otp);
        if (res.etaMinutes != null) setEta(res.etaMinutes);
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

  const complete = (requestId: number) => {
    setBusy(true);
    startTransition(async () => {
      const res = await completeSos(requestId);
      if (res.error) setErrorBanner(res.error);
      setActiveCase(null);
      setCasePatient(null);
      setOwnPosition(null);
      setOtp(null);
      setOtpInput("");
      setArrived(null);
      setVerified(null);
      setFare(null);
      setBusy(false);
      router.refresh();
    });
  };

  const markArrived = (requestId: number) => {
    setBusy(true);
    startTransition(async () => {
      const res = await markSosArrived(requestId);
      if (res.error) setErrorBanner(res.error);
      else setArrived(new Date().toISOString());
      setBusy(false);
      router.refresh();
    });
  };

  const verifyOtp = (requestId: number) => {
    setBusy(true);
    startTransition(async () => {
      const res = await verifySosOtp(requestId, otpInput);
      if (res.error) setErrorBanner(res.error);
      else {
        setVerified(new Date().toISOString());
        setOtpInput("");
        // Show the same number the bill will carry so the doctor can quote it.
        const km = Number(initialActiveCase?.distanceKm ?? 0);
        setFare(Math.max(SOS_FARE.minFare, SOS_FARE.baseFare + km * SOS_FARE.perKm));
      }
      setBusy(false);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* Active case banner — en route → arrived → identity verified */}
      {activeCase != null && (
        <div className="overflow-hidden rounded-3xl border-2 border-emerald-200 bg-white shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-lg">🚑</span>
              <div>
                <p className="font-bold text-emerald-700">
                  {verified ? "Visit in progress" : arrived ? "At the patient" : "En route — sharing live location"}
                </p>
                <p className="text-xs text-slate-500">
                  {eta != null && !arrived
                    ? `About ${eta} min to the patient. `
                    : "Your GPS position is visible to the patient (updated every 5s). "}
                  {initialActiveCase?.distanceKm
                    ? `Distance ${initialActiveCase.distanceKm} km.`
                    : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-600" /> LIVE
              </span>
              {verified ? (
                <button
                  onClick={() => complete(activeCase)}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Complete visit
                  {fare != null ? ` · ₹${fare}` : ""}
                </button>
              ) : null}
            </div>
          </div>

          {/* Step 1 — mark arrival */}
          {!arrived && (
            <div className="border-t border-emerald-100 p-5">
              <button
                onClick={() => markArrived(activeCase)}
                disabled={busy}
                className="btn-primary !py-2 text-sm"
              >
                <MapPin className="h-4 w-4" /> I&apos;ve arrived
              </button>
            </div>
          )}

          {/* Step 2 — confirm the patient's identity with the arrival code */}
          {arrived && !verified && (
            <div className="border-t border-emerald-100 space-y-3 p-5">
              <div>
                <p className="text-sm font-semibold text-ink">Confirm the patient&apos;s identity</p>
                <p className="mt-1 text-xs text-slate-500">
                  Ask the patient for this code, then enter it below.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 px-4 py-2 font-mono text-2xl font-bold tracking-[0.3em] text-emerald-700">
                  {otp ?? "······"}
                </span>
                <input
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  placeholder="6-digit code"
                  aria-label="Patient arrival code"
                  className="input w-40 font-mono text-lg tracking-widest"
                />
                <button
                  onClick={() => verifyOtp(activeCase)}
                  disabled={busy || otpInput.length !== 6}
                  className="btn-primary !py-2 text-sm disabled:opacity-50"
                >
                  Verify code
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — fare, then complete */}
          {verified && (
            <div className="border-t border-emerald-100 space-y-2 p-5">
              <p className="text-sm font-semibold text-ink">Identity confirmed</p>
              <p className="text-xs text-slate-500">
                {fare != null
                  ? `Estimated fare ₹${fare} (base + distance, minimum ₹${SOS_FARE.minFare}). The bill is generated when you complete the visit.`
                  : "The bill is generated when you complete the visit."}
              </p>
            </div>
          )}

          {errorBanner && (
            <p className="border-t border-red-100 bg-red-50 px-5 py-3 text-sm font-medium text-red-700">
              {errorBanner}
            </p>
          )}

          {casePatient && (
            <SosLiveMap
              patientLat={Number(casePatient.lat)}
              patientLng={Number(casePatient.lng)}
              doctorLat={ownPosition?.lat ?? null}
              doctorLng={ownPosition?.lng ?? null}
              height={260}
            />
          )}
        </div>
      )}
      {/* On-duty toggle */}
      <div className="card flex items-center justify-between p-6">
        <div>
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">On-duty status</h2>
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

      {/* Push alerts toggle (browser notifications even when the tab is closed) */}
      {pushEnabled !== null && (
        <div className="card flex items-center justify-between p-6">
          <div>
            <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">Push alerts</h2>
            <p className="text-xs text-slate-500">
              Get emergency alerts as browser notifications, even when this tab is closed.
            </p>
          </div>
          <button
            onClick={togglePush}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition ${
              pushEnabled ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
            }`}
          >
            {pushEnabled ? (
              <>
                <Bell className="h-4 w-4" /> Alerts On
              </>
            ) : (
              <>
                <BellOff className="h-4 w-4" /> Enable Alerts
              </>
            )}
          </button>
        </div>
      )}

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
