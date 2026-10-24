"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type RefObject } from "react";
import { Loader2, MapPin, Phone, X } from "lucide-react";
import { cancelSos, rateSosCase, triggerSos } from "@/lib/dispatch/actions";
import { SosLiveMap } from "@/components/sos/sos-live-map";
import { useWakeLock } from "@/components/sos/use-wake-lock";
import { SOS_FARE, estimateSosFare } from "@/lib/config";
import { useToast } from "@/components/ui/toast";
import {
  EmergencyAppOnly,
  useEmergencyAccess,
  useEmergencyGate,
} from "@/components/emergency/app-only-notice";

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
  // SOS parity fields. `patientOtp` is intentionally absent: only the doctor's
  // panel ever holds the plaintext code.
  etaMinutes: number | null;
  distanceKm: string | null;
  arrivedAt: string | null;
  otpVerifiedAt: string | null;
  rating: number | null;
  billingId: number | null;
  fare: number | null;
};

/** Uber-style booking progress strip: one entry per dispatch step. */
const SOS_STEPS = [
  "Requested",
  "Doctor assigned",
  "On the way",
  "Arrived",
  "Visit in progress",
  "Done",
] as const;

/** Nominal distance the pre-booking fare estimate is priced against. */
const FARE_SAMPLE_KM = 5;

/** Dispatch radius — on-duty doctors within this many km are alerted. */
const SOS_RADIUS_KM = 10;

/** Booking errors surface as toasts; the sheet keeps the previous values. */
const BOOKING_ERROR_TTL = 8000;

type StatusSnapshot = {
  status: string;
  arrived: boolean;
  otp: boolean;
  doctorName: string | null;
  doctorPhone: string | null;
  etaMinutes: number | null;
  fare: number | null;
};

/**
 * Which strip step a status payload maps to. Derives everything from the
 * payload (no extra state), so the strip is correct after a reload too.
 */
function stepForStatus(status: StatusPayload): number {
  if (status.status === "completed") return 5;
  if (status.status !== "accepted") return 0;
  if (status.otpVerifiedAt != null) return 4;
  if (status.arrivedAt != null) return 3;
  if (status.doctor && (status.doctor.liveLatitude != null || status.etaMinutes != null)) return 2;
  return 1;
}

/**
 * Uber-style SOS dispatch, native-app only:
 * - A single big pulsing red button opens a bottom-sheet booking flow
 *   (pickup location + complaint + fare estimate + confirm).
 * - After dispatch, a live tracker shows the patient marker and the moving
 *   doctor marker, driven by the SSE stream with a 3s polling fallback.
 * - Browsers (desktop + installed PWA) see the button and an app-only
 *   notice: the feature stays visible but only fires inside the app.
 */
export function SosDispatchButton({ initialRequestId = null }: { initialRequestId?: number | null }) {
  const { available, refresh } = useEmergencyAccess();
  const gate = useEmergencyGate();
  const { notify } = useToast();

  const [locating, setLocating] = useState(false);
  const [pending, startTransition] = useTransition();
  const [requestId, setRequestId] = useState<number | null>(initialRequestId);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [useGps, setUseGps] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingBusy, setRatingBusy] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  // Booking sheet state.
  const [sheetOpen, setSheetOpen] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  // SSE unsupported / connection dropped → fall back to the 3s poll.
  // Seeded from capability detection (not an effect) so no synced setState
  // is needed for the "no EventSource" case.
  const [streamBroken, setStreamBroken] = useState(
    () => typeof EventSource === "undefined"
  );
  const lastRequestIdRef = useRef<number | null>(initialRequestId);
  // Last toasted transition — compared against the previous snapshot so each
  // transition fires exactly once.
  const prevSnapshotRef = useRef<StatusSnapshot | null>(null);

  // Keep the screen awake while the tracker is live so the patient keeps
  // seeing doctor movement (Android + iOS 16.4+; safe no-op elsewhere).
  const trackingLive = requestId != null && status?.status === "accepted";
  useWakeLock(Boolean(trackingLive));
  // formRef reads CURRENT DOM input values at click time (no React state
  // batching races between the toggle/fill and the SOS tap).
  const formRef = useRef<HTMLFormElement>(null);
  // Booking sheet has its own copy of the manual-coordinate form (the idle
  // panel's form unmounts behind the sheet, so it cannot be reused).
  const sheetFormRef = useRef<HTMLFormElement>(null);
  const complaintRef = useRef<HTMLTextAreaElement>(null);
  const gpsModeRef = useRef(true);

  const getPosition = useCallback((): Promise<{ lat: number; lng: number }> => {
    const { promise, resolve, reject } = Promise.withResolvers<{ lat: number; lng: number }>();
    if (!navigator.geolocation) {
      reject(new Error("Location not supported on this device."));
      return promise;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error("Could not get your location. Please enter coordinates.")),
      { enableHighAccuracy: true, timeout: 10000 }
    );
    return promise;
  }, []);

  const toggleMode = () => {
    const next = !gpsModeRef.current;
    gpsModeRef.current = next;
    setUseGps(next);
  };

  // Shared location row: GPS read-out (or the existing manual-coordinate
  // inputs as fallback) + the GPS/manual toggle. Rendered in the idle panel
  // and in the booking sheet against the right form ref.
  const renderLocationRow = (formEl: RefObject<HTMLFormElement | null>) => (
    <>
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
        coords ? (
          <div className="flex items-start gap-2 rounded-xl bg-brand-50 px-3 py-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">Using your current location</p>
              <p className="truncate text-xs text-ink-muted">
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setLocating(true);
              getPosition()
                .then((pos) => {
                  setCoords(pos);
                  setLocating(false);
                })
                .catch((e) => {
                  setError(e instanceof Error ? e.message : "Could not get your location.");
                  setLocating(false);
                });
            }}
            disabled={locating}
            className="btn-secondary w-full justify-center py-2 text-xs"
          >
            {locating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Getting your location…
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4" /> Use my current location
              </>
            )}
          </button>
        )
      ) : (
        <form ref={formEl} className="grid grid-cols-2 gap-3">
          <input name="latitude" placeholder="Latitude" className="input" inputMode="decimal" />
          <input name="longitude" placeholder="Longitude" className="input" inputMode="decimal" />
        </form>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </>
  );

  // SOS press: app-only gate, then open the booking sheet.
  const pressSos = () => {
    if (!gate("patient")) return;
    // Bridge arrived after first paint (Capacitor re-injects on resume):
    // adopt it now so the gate branch yields to the booking UI.
    if (!available) refresh();
    setSheetOpen(true);
  };

  const fetchStatus = useCallback(async () => {
    if (!requestId) return;
    try {
      const r = await fetch(`/api/patient/sos/status/${requestId}`, { credentials: "include" });
      if (r.ok) setStatus((await r.json()) as StatusPayload);
    } catch {
      /* retry on the next tick */
    }
  }, [requestId]);

  // A new request gets a fresh stream attempt (a previous failure shouldn't
  // pin every later dispatch to the polling fallback).
  useEffect(() => {
    if (lastRequestIdRef.current === requestId) return;
    lastRequestIdRef.current = requestId;
    if (requestId != null) {
      // Deferred: the cascading-render rule forbids synchronous setState in
      // effects; the reset still lands before the stream effect re-runs.
      const t = setTimeout(() => setStreamBroken(false), 0);
      prevSnapshotRef.current = null;
      return () => clearTimeout(t);
    }
  }, [requestId]);

  // Live stream: refetch the status endpoint on every sos:status frame.
  useEffect(() => {
    if (!requestId || streamBroken) return;
    const source = new EventSource("/api/patient/sos/stream");
    source.onmessage = (ev: MessageEvent) => {
      try {
        const frame = JSON.parse(String(ev.data)) as { type?: string };
        if (frame?.type === "sos:status") void fetchStatus();
      } catch {
        /* ignore malformed frames */
      }
    };
    // Network drop / SSE unsupported → fall back to polling.
    source.onerror = () => {
      try {
        source.close();
      } catch {
        /* already closed */
      }
      setStreamBroken(true);
    };
    // Deferred so the first fetch doesn't setState synchronously during the
    // effect (cascading-render lint rule) while still priming immediately.
    const prime = setTimeout(() => void fetchStatus(), 0);
    return () => {
      clearTimeout(prime);
      try {
        source.close();
      } catch {
        /* already closed */
      }
    };
  }, [requestId, streamBroken, fetchStatus]);

  // Fallback path — plain 3s polling, only used when the stream is broken.
  useEffect(() => {
    if (!requestId || !streamBroken) return;
    const tick = () => void fetchStatus();
    const prime = setTimeout(tick, 0);
    const poll = setInterval(tick, 3000);
    return () => {
      clearTimeout(prime);
      clearInterval(poll);
    };
  }, [requestId, streamBroken, fetchStatus]);

  // Transition toasts — exactly once per transition (previous snapshot in a
  // ref, so re-renders never re-fire).
  useEffect(() => {
    if (!status) {
      prevSnapshotRef.current = null;
      return;
    }
    const snapshot: StatusSnapshot = {
      status: status.status,
      arrived: status.arrivedAt != null,
      otp: status.otpVerifiedAt != null,
      doctorName: status.doctor?.name ?? null,
      doctorPhone: status.doctor?.phone ?? null,
      etaMinutes: status.etaMinutes,
      fare: status.fare,
    };
    const prev = prevSnapshotRef.current;
    if (prev && prev.status !== snapshot.status) {
      if (snapshot.status === "pending") {
        notify({ title: "Searching for nearby doctors…", tone: "info", ttl: 5000 });
      } else if (snapshot.status === "accepted") {
        const phone = snapshot.doctorPhone;
        notify({
          title: `🚑 Dr. ${snapshot.doctorName ?? "your doctor"} is on the way`,
          body:
            snapshot.etaMinutes != null
              ? `Estimated arrival in ${snapshot.etaMinutes} minutes.`
              : "Live tracking is on.",
          tone: "success",
          ttl: 6000,
          actions: phone
            ? [
                {
                  label: "Call",
                  onClick: () => {
                    window.location.href = `tel:${phone}`;
                  },
                },
              ]
            : undefined,
        });
      } else if (snapshot.status === "completed") {
        notify({
          title: "Visit completed",
          body:
            snapshot.fare != null
              ? `Fare settled at ₹${snapshot.fare.toLocaleString("en-IN")}.`
              : undefined,
          tone: "success",
        });
      } else if (snapshot.status === "expired") {
        notify({ title: "No doctor was available", tone: "warning", ttl: 7000 });
      } else if (snapshot.status === "cancelled") {
        notify({ title: "Request cancelled", tone: "warning" });
      }
    }
    if (prev && !prev.arrived && snapshot.arrived) {
      notify({ title: "Your doctor has arrived", tone: "warning", ttl: 7000 });
    }
    if (prev && !prev.otp && snapshot.otp) {
      notify({ title: "Visit in progress", tone: "info" });
    }
    prevSnapshotRef.current = snapshot;
  }, [status, notify]);

  // Booking sheet: auto-locate on open, fall back to manual coordinates.
  useEffect(() => {
    if (!sheetOpen) return;
    // One deferred reset block: the cascading-render rule forbids
    // synchronous setState inside effects.
    const prime = setTimeout(() => {
      setError(null);
      setCoords(null);
      setUseGps(true);
      setLocating(true);
    }, 0);
    gpsModeRef.current = true;
    let alive = true;
    getPosition()
      .then((pos) => {
        if (!alive) return;
        setCoords(pos);
        setLocating(false);
      })
      .catch((e) => {
        if (!alive) return;
        setLocating(false);
        setError(
          e instanceof Error ? e.message : "Could not determine your location. Please enter coordinates."
        );
        setUseGps(false);
        gpsModeRef.current = false;
      });
    return () => {
      clearTimeout(prime);
      alive = false;
    };
  }, [sheetOpen, getPosition]);

  // Lock body scroll while the sheet is open.
  useEffect(() => {
    if (!sheetOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sheetOpen]);

  // Confirm the booking: same FormData contract as before, errors as toasts.
  const confirmBooking = () => {
    setError(null);
    startTransition(async () => {
      try {
        let lat: number;
        let lng: number;
        if (gpsModeRef.current) {
          if (coords) {
            lat = coords.lat;
            lng = coords.lng;
          } else {
            setLocating(true);
            const pos = await getPosition();
            setCoords(pos);
            setLocating(false);
            lat = pos.lat;
            lng = pos.lng;
          }
        } else {
          // Read from the DOM directly via form data — no stale state races.
          if (!sheetFormRef.current) {
            setError("Form not ready.");
            return;
          }
          const fd = new FormData(sheetFormRef.current);
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
        fd.set("radius_km", String(SOS_RADIUS_KM));
        const complaint = complaintRef.current?.value?.trim();
        if (complaint) fd.set("complaint", complaint);
        const res = await triggerSos({ error: null }, fd);
        if (res.error) {
          notify({
            title: "Couldn't request emergency help",
            body: res.error,
            tone: "critical",
            ttl: BOOKING_ERROR_TTL,
          });
          return;
        }
        if (res.requestId) {
          setLocating(false);
          setSheetOpen(false);
          setRequestId(res.requestId);
        }
      } catch (err) {
        setLocating(false);
        notify({
          title: "Couldn't request emergency help",
          body: err instanceof Error ? err.message : "Please check your location and try again.",
          tone: "critical",
          ttl: BOOKING_ERROR_TTL,
        });
      }
    });
  };

  // The big pulsing red SOS button — shared by the browser gate and the
  // native idle screen.
  const sosButton = (
    <button
      onClick={pressSos}
      disabled={pending || locating}
      className="group relative mx-auto mt-6 flex h-44 w-44 items-center justify-center"
      aria-label="Send SOS"
    >
      {/* Pulsing rings */}
      <span className="absolute inset-0 animate-ping rounded-full bg-red-400/40" />
      <span className="absolute inset-3 animate-pulse rounded-full bg-red-500/40" />
      <span className="relative flex h-32 w-32 items-center justify-center rounded-full border-4 border-red-300 bg-red-500 text-white shadow-2xl transition group-active:scale-95">
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
  );

  const renderStepStrip = (current: number) => (
    <ol className="flex items-stretch gap-1" aria-label="Request progress">
      {SOS_STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={label} className="min-w-0 flex-1">
            <span
              className={`block h-1.5 rounded-full ${
                done || active ? "bg-emerald-500" : "bg-slate-200"
              }`}
            />
            <p
              className={`mt-1 truncate text-[9px] font-semibold uppercase tracking-wide ${
                active ? "text-emerald-700" : done ? "text-emerald-600" : "text-slate-400"
              }`}
            >
              {label}
            </p>
          </li>
        );
      })}
    </ol>
  );

  // ── App-only gate ────────────────────────────────────────────────────────
  if (available === null) return null;

  if (available === false) {
    // Any browser (desktop or installed PWA): the feature stays visible but
    // locked — the button fires the download toast instead of dispatching.
    return (
      <div className="space-y-4">
        <div className="overflow-hidden rounded-3xl border-2 border-red-200 bg-white shadow-lg">
          <div className="bg-red-600 px-6 py-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-red-100">Emergency SOS</p>
            {sosButton}
            <p className="mt-4 text-xs text-red-100">
              Emergency visits are booked in the SkoraCare mobile app.
            </p>
          </div>
        </div>
        <EmergencyAppOnly surface="patient" />
      </div>
    );
  }

  // Request dispatched but the first status poll hasn't returned yet — show a
  // neutral pending state instead of falling back to the idle SOS button
  // (which would let the patient fire a second SOS while one is active).
  if (requestId && !status) {
    return (
      <div className="rounded-3xl border-2 border-red-200 bg-white p-6 text-center shadow-lg">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
        <p className="mt-2 font-semibold text-slate-700">Checking your SOS request…</p>
        <p className="mt-1 text-sm text-slate-500">Hang tight — we are confirming the request status.</p>
      </div>
    );
  }

  // Live map view while waiting / accepted.
  if (requestId && status) {
    const step = stepForStatus(status);
    const pLat = Number(status.patientLatitude);
    const pLng = Number(status.patientLongitude);
    const dLat = status.doctor?.liveLatitude ? Number(status.doctor.liveLatitude) : null;
    const dLng = status.doctor?.liveLongitude ? Number(status.doctor.liveLongitude) : null;
    const resetRequest = () => {
      setRequestId(null);
      setStatus(null);
      setRating(0);
      setRatingError(null);
      prevSnapshotRef.current = null;
    };

    if (status.status === "pending") {
      return (
        <div className="overflow-hidden rounded-3xl border-2 border-red-200 bg-white shadow-lg">
          <div className="space-y-3 p-5">
            {renderStepStrip(step)}
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
                setCancelling(false);
                resetRequest();
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
      // Arrival + identity states drive the banner copy; the map and Call
      // button stay identical to before in every step.
      const arrived = status.arrivedAt != null;
      const identityConfirmed = status.otpVerifiedAt != null;
      return (
        <div className="overflow-hidden rounded-3xl border-2 border-emerald-300 bg-white shadow-lg">
          <div className="p-5">
            {renderStepStrip(step)}
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl">🚑</span>
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-semibold tracking-[-0.01em] text-ink">
                  {identityConfirmed
                    ? "Visit in progress"
                    : arrived
                      ? `Dr. ${status.doctor.name} has arrived`
                      : status.etaMinutes != null
                        ? `Dr. ${status.doctor.name} is ${status.etaMinutes} min away`
                        : `Dr. ${status.doctor.name} is on the way`}
                </p>
                <p className="text-xs text-slate-500">
                  {identityConfirmed
                    ? "The doctor has confirmed your identity."
                    : arrived
                      ? "Show the doctor your arrival code so they can confirm it's you."
                      : dLat != null
                        ? "En route — live tracking"
                        : "Help has been dispatched"}
                  {status.distanceKm ? ` · ${status.distanceKm} km` : ""}
                </p>
              </div>
              {status.doctor.phone && (
                <a href={`tel:${status.doctor.phone}`} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800">
                  <Phone className="h-4 w-4" /> Call
                </a>
              )}
            </div>
            {arrived && !identityConfirmed && (
              <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800">
                Ask the doctor for their arrival code and read it out to them — that is how they
                confirm they are with the right patient.
              </p>
            )}
          </div>
          <SosLiveMap patientLat={pLat} patientLng={pLng} doctorLat={dLat} doctorLng={dLng} height={300} />
          <div className="p-4 text-center text-xs text-slate-500">
            {dLat != null ? "Tracking your doctor live" : "Waiting for the doctor to start moving…"}
          </div>
        </div>
      );
    }

    // Completed and not yet rated — the patient rates the visit.
    if (status.status === "completed" && status.rating == null) {
      return (
        <div className="rounded-3xl border-2 border-emerald-300 bg-white p-6 text-center shadow-lg">
          {renderStepStrip(step)}
          <p className="font-semibold text-ink">How was your emergency visit?</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`Rate ${n} of 5`}
                onClick={() => setRating(n)}
                className={`text-3xl transition ${
                  rating >= n ? "text-amber-500" : "text-slate-300"
                } hover:text-amber-400`}
              >
                ★
              </button>
            ))}
          </div>
          {ratingError && <p className="mt-2 text-sm font-medium text-red-600">{ratingError}</p>}
          <button
            onClick={async () => {
              if (rating === 0) {
                setRatingError("Pick a rating from 1 to 5.");
                return;
              }
              setRatingBusy(true);
              setRatingError(null);
              const res = await rateSosCase(requestId, rating, "");
              if (res.error) setRatingError(res.error);
              else await fetchStatus();
              setRatingBusy(false);
            }}
            disabled={ratingBusy}
            className="btn-primary mt-4 justify-center"
          >
            {ratingBusy ? "Submitting…" : "Submit rating"}
          </button>
        </div>
      );
    }

    return (
      <div className="rounded-3xl border-2 border-red-200 bg-white p-6 text-center shadow-lg">
        {renderStepStrip(step)}
        <p className="font-semibold text-slate-700">
          {status.status === "expired" ? "No doctor was available nearby." : "This request is no longer active."}
        </p>
        <p className="mt-1 text-sm text-slate-500">Please call emergency services or try again.</p>
        <button onClick={resetRequest} className="btn-primary mt-4 justify-center">
          New SOS
        </button>
      </div>
    );
  }

  // Idle state — the big Uber-style SOS button, location row and booking sheet.
  return (
    <>
      <div className="overflow-hidden rounded-3xl border-2 border-red-200 bg-white shadow-lg">
        <div className="bg-red-600 px-6 py-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-red-100">Emergency SOS</p>
          {sosButton}
          <p className="mt-4 text-xs text-red-100">
            {locating ? "Getting your location…" : pending ? "Sending your request…" : "Tap the button — we’ll find nearby doctors instantly."}
          </p>
        </div>

        <div className="space-y-3 p-5">
          {/* Location source */}
          {renderLocationRow(formRef)}
        </div>
      </div>

      {/* Booking sheet — Uber-style bottom sheet over the idle screen. */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Request emergency help"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSheetOpen(false);
          }}
        >
          <div className="mx-auto w-full max-w-md rounded-t-3xl border-t-2 border-red-200 bg-white shadow-float">
            <div className="max-h-[85vh] overflow-y-auto pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-3 backdrop-blur">
                <p className="font-display text-base font-bold text-ink">Emergency visit</p>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  aria-label="Close booking sheet"
                  className="-m-1 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 p-5">
                {/* (a) Location row — GPS on open, manual coordinates as fallback */}
                <div className="rounded-2xl border border-slate-200 p-3">
                  {renderLocationRow(sheetFormRef)}
                </div>

                {/* (b) Complaint (optional) */}
                <div>
                  <label htmlFor="sos-complaint" className="label">
                    What is happening?{" "}
                    <span className="font-normal text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    id="sos-complaint"
                    ref={complaintRef}
                    rows={3}
                    maxLength={500}
                    placeholder="e.g. chest pain, breathing difficulty, a fall…"
                    className="input resize-none"
                  />
                  <p className="mt-1 text-right text-[11px] text-slate-400">
                    Up to 500 characters
                  </p>
                </div>

                {/* (c) Fare estimate */}
                <div className="rounded-2xl bg-brand-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">Estimated fare</p>
                    <p className="font-display text-lg font-bold text-brand-700">
                      ₹{estimateSosFare(FARE_SAMPLE_KM).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">
                    Base ₹{SOS_FARE.baseFare} · ₹{SOS_FARE.perKm}/km · Minimum ₹{SOS_FARE.minFare}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Estimate for about {FARE_SAMPLE_KM} km — the final fare settles with the distance travelled.
                  </p>
                </div>

                {/* (d) Confirm */}
                <button
                  onClick={confirmBooking}
                  disabled={pending || locating}
                  className="btn-primary w-full justify-center py-3.5 text-base"
                >
                  {(pending || locating) && <Loader2 className="h-5 w-5 animate-spin" />}
                  Request emergency help
                </button>
                <p className="text-center text-[11px] text-slate-500">
                  Only on-duty doctors within {SOS_RADIUS_KM} km of your location are alerted.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
