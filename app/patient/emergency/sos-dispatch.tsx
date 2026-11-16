"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  FileText,
  HeartPulse,
  Info,
  Loader2,
  MessageSquare,
  Phone,
  PhoneCall,
  Send,
  ShieldAlert,
  Smartphone,
  Star,
  X,
} from "lucide-react";
import { cancelSos, rateSosCase, triggerSos, refreshPatientLocation } from "@/lib/dispatch/actions";
import { SosLiveMap } from "@/components/sos/sos-live-map";
import { useWakeLock } from "@/components/sos/use-wake-lock";
import { APP_DOWNLOAD_LABEL, APP_DOWNLOAD_URL } from "@/lib/config";
import { useToast } from "@/components/ui/toast";
import { useEmergencyAccess, useEmergencyGate } from "@/components/emergency/app-only-notice";
import { StatusBadge } from "@/components/ui/dashboard-ui";

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
  etaMinutes: number | null;
  distanceKm: string | null;
  arrivedAt: string | null;
  otpVerifiedAt: string | null;
  rating: number | null;
  billingId: number | null;
  fare: number | null;
};

type HistoryItem = {
  id: number;
  status: string;
  complaint: string | null;
  createdAt: Date | string | null;
  acceptedAt: Date | string | null;
  cancelledAt: Date | string | null;
  acceptedBy: string | null;
  rating?: number | null;
  distanceKm?: string | null;
  fare?: number | string | null;
};

type EmergencyTier = {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  vehicle: string;
  priceEstimate: number;
  badge?: string;
  etaDisplay: string;
};

const EMERGENCY_TIERS: EmergencyTier[] = [
  {
    id: "quick_bike",
    name: "DOCTOR BIKE",
    subtitle: "Fastest response for vitals & critical first aid",
    icon: "🏍️",
    vehicle: "Emergency First-Response Bike",
    priceEstimate: 499,
    etaDisplay: "3-5 mins",
  },
  {
    id: "standard_doc",
    name: "STANDARD DOCTOR",
    subtitle: "On-call physician home visit with emergency kit",
    icon: "🚗",
    vehicle: "Physician Response Car",
    priceEstimate: 999,
    etaDisplay: "8-12 mins",
  },
  {
    id: "mobile_icu",
    name: "MOBILE ICU / ALS",
    subtitle: "Advanced life support: oxygen, ECG, doc & paramedic",
    icon: "🚑",
    vehicle: "Advanced Mobile ICU Unit",
    priceEstimate: 1850,
    badge: "RECOMMENDED",
    etaDisplay: "6-10 mins",
  },
  {
    id: "hospital_transfer",
    name: "HOSPITAL AMBULANCE",
    subtitle: "Stretcher transport to nearest emergency trauma center",
    icon: "🏥",
    vehicle: "Critical Transport Van",
    priceEstimate: 2490,
    etaDisplay: "10-15 mins",
  },
];

const SOS_RADIUS_KM = 10;
const BOOKING_ERROR_TTL = 8000;

export function SosDispatchButton({
  initialRequestId = null,
  history = [],
  supportPhone = "+91 108",
  patientName = "Patient",
  patientPhone = "",
}: {
  initialRequestId?: number | null;
  history?: HistoryItem[];
  supportPhone?: string;
  patientName?: string;
  patientPhone?: string;
}) {
  const { available } = useEmergencyAccess();
  const gate = useEmergencyGate();
  const { notify } = useToast();

  const [locating, setLocating] = useState(false);
  const [pending, startTransition] = useTransition();
  const [requestId, setRequestId] = useState<number | null>(initialRequestId);
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingBusy, setRatingBusy] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);

  // Contra Mockup State management
  const [selectedTier, setSelectedTier] = useState<string>("mobile_icu");
  const [complaintText, setComplaintText] = useState("");
  const [destinationText, setDestinationText] = useState("On-Site Emergency Care & Triage");
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ text: string; sender: "patient" | "doctor"; time: string }>>([
    {
      text: "Doctor dispatched. Please stay where you are and keep your phone reachable.",
      sender: "doctor",
      time: "Just now",
    },
  ]);
  const [newMessageText, setNewMessageText] = useState("");

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [addressDisplay, setAddressDisplay] = useState("Locating your coordinates…");
  const [streamBroken, setStreamBroken] = useState(() => typeof EventSource === "undefined");

  const trackingLive = requestId != null && status?.status === "accepted";
  useWakeLock(Boolean(trackingLive));

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

  // Auto-locate GPS on mount for mobile app (deferred to avoid cascading render)
  useEffect(() => {
    if (available === false) return;
    let isCancelled = false;
    const timer = setTimeout(() => {
      if (isCancelled) return;
      setLocating(true);
      getPosition()
        .then((pos) => {
          if (isCancelled) return;
          setCoords(pos);
          setLocating(false);
          setAddressDisplay(`${pos.lat.toFixed(4)}° N, ${pos.lng.toFixed(4)}° E (Current GPS)`);
        })
        .catch(() => {
          if (isCancelled) return;
          setLocating(false);
          setAddressDisplay("GPS location pending (Tap to refresh)");
        });
    }, 0);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [available, getPosition]);

  const fetchStatus = useCallback(async () => {
    if (!requestId) return;
    try {
      const r = await fetch(`/api/patient/sos/status/${requestId}`, { credentials: "include" });
      if (r.ok) setStatus((await r.json()) as StatusPayload);
    } catch {
      /* retry on next tick */
    }
  }, [requestId]);

  // Live SSE stream
  useEffect(() => {
    if (!requestId || streamBroken) return;
    const source = new EventSource("/api/patient/sos/stream");
    source.onmessage = (ev: MessageEvent) => {
      try {
        const frame = JSON.parse(String(ev.data)) as { type?: string };
        if (frame?.type === "sos:status") void fetchStatus();
      } catch {
        /* ignore */
      }
    };
    source.onerror = () => {
      try {
        source.close();
      } catch {}
      setStreamBroken(true);
    };
    const prime = setTimeout(() => void fetchStatus(), 0);
    return () => {
      clearTimeout(prime);
      try {
        source.close();
      } catch {}
    };
  }, [requestId, streamBroken, fetchStatus]);

  // Fallback polling (3s)
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

  // Coarse 30s location refresh while accepted
  useEffect(() => {
    if (!requestId || status?.status !== "accepted") return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    let cancelled = false;
    const sendCurrentPosition = () => {
      if (cancelled) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          const fd = new FormData();
          fd.set("requestId", String(requestId));
          fd.set("latitude", String(pos.coords.latitude));
          fd.set("longitude", String(pos.coords.longitude));
          void refreshPatientLocation({ error: null }, fd).catch(() => undefined);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 }
      );
    };

    const prime = setTimeout(sendCurrentPosition, 1_500);
    const poll = setInterval(sendCurrentPosition, 30_000);
    return () => {
      cancelled = true;
      clearTimeout(prime);
      clearInterval(poll);
    };
  }, [requestId, status?.status]);

  // Confirm booking & Trigger SOS
  const handleRaiseSos = () => {
    if (!gate("patient")) return;
    startTransition(async () => {
      try {
        let lat: number;
        let lng: number;
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

        const activeTier = EMERGENCY_TIERS.find((t) => t.id === selectedTier);
        const fd = new FormData();
        fd.set("latitude", String(lat));
        fd.set("longitude", String(lng));
        fd.set("radius_km", String(SOS_RADIUS_KM));

        const complaint = complaintText.trim()
          ? `[${activeTier?.name ?? "SOS"}] ${complaintText.trim()}`
          : `[${activeTier?.name ?? "SOS"}] Emergency assistance requested at ${destinationText}`;
        fd.set("complaint", complaint);

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
          setRequestId(res.requestId);
          notify({
            title: "🚨 SOS Alert Dispatched",
            body: "Alerting on-duty doctors and mobile response units near you.",
            tone: "success",
            ttl: 5000,
          });
        }
      } catch (err) {
        setLocating(false);
        notify({
          title: "Location error",
          body: err instanceof Error ? err.message : "Please verify GPS permissions.",
          tone: "critical",
          ttl: BOOKING_ERROR_TTL,
        });
      }
    });
  };

  const handleSendMessage = () => {
    if (!newMessageText.trim()) return;
    const msg = {
      text: newMessageText.trim(),
      sender: "patient" as const,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, msg]);
    setNewMessageText("");
  };

  // ═════════════════════════════════════════════════════════════════════════
  // SURFACE 1: WEB BROWSER VIEW (App Disabled, Full History Displayed)
  // ═════════════════════════════════════════════════════════════════════════
  if (available === false) {
    return (
      <div className="space-y-6">
        {/* App-Only Notification Card */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-emerald-50/40 p-6 sm:p-8 shadow-soft">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-700 text-white shadow-lift">
              <Smartphone className="h-8 w-8" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-100/80 px-3 py-1 text-xs font-bold text-brand-800">
                <ShieldAlert className="h-3.5 w-3.5" /> Mobile Application Feature
              </div>
              <h2 className="mt-2 font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
                This feature only works on Application
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                Emergency SOS live booking, real-time doctor GPS tracking, and instant mobile dispatch are available exclusively in the <strong>SkoraCare Mobile App</strong>. For medical emergencies right now, please use the helplines below.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-brand-100">
            <Link
              href={APP_DOWNLOAD_URL}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-700 px-6 py-3.5 text-sm font-bold text-white shadow-lift transition hover:bg-brand-800"
            >
              <Smartphone className="h-4 w-4" /> {APP_DOWNLOAD_LABEL}
            </Link>
            <p className="text-xs text-ink-muted">
              Available on iOS & Android · Real-time GPS & live emergency dispatch
            </p>
          </div>
        </div>

        {/* Immediate Helpline Call Cards */}
        <div className="overflow-hidden rounded-3xl border-2 border-red-200 bg-white shadow-soft">
          <div className="bg-red-50/70 px-5 py-3.5 border-b border-red-100">
            <p className="text-xs font-bold uppercase tracking-wider text-red-700 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" /> Immediate Emergency Helplines
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-5">
            <a
              href="tel:108"
              className="flex items-center justify-center gap-2.5 rounded-2xl bg-red-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-red-700 shadow-sm"
            >
              <Phone className="h-4 w-4" /> Emergency (108)
            </a>
            <a
              href="tel:102"
              className="flex items-center justify-center gap-2.5 rounded-2xl border-2 border-red-200 bg-red-50/50 px-5 py-3.5 text-sm font-bold text-red-700 transition hover:bg-red-100"
            >
              <PhoneCall className="h-4 w-4" /> Ambulance (102)
            </a>
            <a
              href={`tel:${supportPhone.replace(/[^0-9+]/g, "")}`}
              className="flex items-center justify-center gap-2.5 rounded-2xl border-2 border-slate-200 bg-slate-50 px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
            >
              <PhoneCall className="h-4 w-4" /> Clinic Helpline
            </a>
          </div>
        </div>

        {/* Full Past Emergencies History Section */}
        <div className="overflow-hidden rounded-3xl border-2 border-slate-200 bg-white shadow-soft">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-ink">Emergency SOS History</h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Complete record of your past emergency dispatches and visits
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {history.length} {history.length === 1 ? "case" : "cases"}
              </span>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="p-12 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <FileText className="h-6 w-6" />
              </span>
              <p className="mt-3 font-semibold text-ink">No past emergencies found</p>
              <p className="mt-1 text-xs text-ink-muted max-w-sm mx-auto">
                Any emergency visits dispatched via the mobile app will be cataloged here with doctor notes and settled fares.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {history.map((h) => (
                <div key={h.id} className="p-5 hover:bg-slate-50/50 transition">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink text-sm sm:text-base">
                          {h.acceptedBy ? `Attended by Dr. ${h.acceptedBy}` : "Emergency Dispatch"}
                        </span>
                        <StatusBadge status={h.status} />
                      </div>
                      {h.complaint && (
                        <p className="text-xs text-slate-600 font-medium">
                          Reason: <span className="text-slate-800">{h.complaint}</span>
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {h.createdAt
                          ? new Date(h.createdAt).toLocaleString(undefined, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "—"}
                        {h.distanceKm && <span>· {h.distanceKm} km trip</span>}
                      </p>
                    </div>

                    <div className="text-right">
                      {h.fare != null && (
                        <p className="font-display font-bold text-brand-700 text-sm">
                          ₹{Number(h.fare).toLocaleString("en-IN")}
                        </p>
                      )}
                      {h.rating != null && (
                        <div className="flex items-center justify-end gap-0.5 text-amber-500 text-xs font-bold mt-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span>{h.rating}.0</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // SURFACE 2: NATIVE MOBILE APP (CONTRA MOCKUP 3-STATE UI/UX)
  // ═════════════════════════════════════════════════════════════════════════

  const pLat = coords?.lat ?? (status?.patientLatitude ? Number(status.patientLatitude) : 28.6139);
  const pLng = coords?.lng ?? (status?.patientLongitude ? Number(status.patientLongitude) : 77.209);
  const dLat = status?.doctor?.liveLatitude ? Number(status.doctor.liveLatitude) : null;
  const dLng = status?.doctor?.liveLongitude ? Number(status.doctor.liveLongitude) : null;

  const resetRequest = () => {
    setRequestId(null);
    setStatus(null);
    setRating(0);
    setRatingError(null);
  };

  // State A: Pending / Searching for Doctors
  if (requestId && status?.status === "pending") {
    return (
      <div className="relative mx-auto max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-float">
        <div className="relative h-[340px] w-full">
          <SosLiveMap patientLat={pLat} patientLng={pLng} height={340} />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-transparent to-white pointer-events-none" />
          {/* Top route card */}
          <div className="absolute top-4 inset-x-4 flex items-center justify-between rounded-2xl bg-white/95 px-4 py-2.5 shadow-md backdrop-blur border border-slate-100">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 animate-ping rounded-full bg-amber-500" />
              <span className="text-xs font-bold text-ink">Alerting nearby doctors…</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">10 km radius</span>
          </div>
        </div>

        <div className="space-y-4 p-5 text-center">
          <div className="flex justify-center">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-ink">Finding your nearest responder</h3>
            <p className="mt-1 text-xs text-ink-muted">
              On-duty emergency doctors and mobile units have received your distress alert with audio alarm.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3 text-left border border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Your Complaint</p>
            <p className="mt-0.5 text-xs font-semibold text-ink">
              {status.complaint || "Emergency medical assistance"}
            </p>
          </div>

          <button
            onClick={async () => {
              setCancelling(true);
              await cancelSos(requestId);
              setCancelling(false);
              resetRequest();
            }}
            disabled={cancelling}
            className="w-full rounded-2xl border-2 border-slate-200 bg-white py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
          >
            {cancelling ? "Cancelling alert…" : "Cancel SOS request"}
          </button>
        </div>
      </div>
    );
  }

  // State B: Confirmed & Live Doctor En Route (Contra Screen 2 & Screen 3)
  if (requestId && status?.status === "accepted" && status.doctor) {
    const arrived = status.arrivedAt != null;
    const etaText = status.etaMinutes != null ? `${status.etaMinutes}:00` : "2:35";

    return (
      <div className="relative mx-auto max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-float">
        {/* Full Interactive Live Map */}
        <div className="relative h-[380px] w-full">
          <SosLiveMap patientLat={pLat} patientLng={pLng} doctorLat={dLat} doctorLng={dLng} height={380} />

          {/* Floating Top Route Pill (Contra Mockup Screen 2 Top Card) */}
          <div className="absolute top-4 inset-x-4 flex items-center justify-between rounded-full bg-white/95 px-4 py-2.5 shadow-md backdrop-blur border border-slate-200/80">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
              <p className="truncate text-xs font-bold text-ink">
                {addressDisplay.split("(")[0]} <span className="text-slate-400">➔</span> {destinationText}
              </p>
            </div>
            <span className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
              🚑
            </span>
          </div>

          {/* Map Overlay Badge */}
          <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-semibold text-white backdrop-blur">
            Live GPS Tracking
          </div>
        </div>

        {/* Floating Bottom Card: "Your doctor is coming in 2:35" (Contra Mockup Screen 2 Bottom Card) */}
        <div className="p-5 space-y-4 bg-white border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {arrived ? "Responder Arrived" : "Estimated Arrival"}
              </p>
              <h3 className="font-display text-lg font-bold text-ink">
                {arrived ? "Your doctor has arrived" : `Your doctor is coming in ${etaText}`}
              </h3>
            </div>
            <button
              onClick={() => setDetailsDrawerOpen(true)}
              className="text-xs font-bold text-brand-700 hover:text-brand-600 flex items-center gap-0.5"
            >
              Trip details <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Doctor Profile Card */}
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-800 border-2 border-white shadow-sm">
                👨‍⚕️
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">
                  ✓
                </span>
              </div>
              <div>
                <p className="font-bold text-ink text-sm">Dr. {status.doctor.name}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="flex items-center text-amber-500 font-bold">
                    ★ 4.8
                  </span>
                  <span>·</span>
                  <span>{status.distanceKm ? `${status.distanceKm} km away` : "Nearby"}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-lg">🚑</span>
              <p className="text-[10px] font-bold text-slate-500">Medical Unit</p>
            </div>
          </div>

          {/* Two Action Buttons: [MESSAGE] and [CALL] (Contra Mockup Screen 2 Buttons) */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => setMessageModalOpen(true)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#1FD186] py-3.5 text-sm font-bold text-slate-900 transition hover:bg-[#1bc07b] shadow-sm"
            >
              <MessageSquare className="h-4 w-4" /> MESSAGE
            </button>
            <a
              href={status.doctor.phone ? `tel:${status.doctor.phone}` : `tel:${supportPhone}`}
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-[#1FD186] bg-white py-3.5 text-sm font-bold text-slate-900 transition hover:bg-emerald-50/50"
            >
              <Phone className="h-4 w-4 text-[#10B981]" /> CALL
            </a>
          </div>
        </div>

        {/* ── EXPANDED TRIP & PATIENT DETAILS DRAWER (Contra Mockup Screen 3) ── */}
        {detailsDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-md max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl space-y-5">
              {/* Drawer Handle */}
              <div className="mx-auto h-1 w-10 rounded-full bg-slate-200" />

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-display text-lg font-bold text-ink">
                    {arrived ? "Doctor Arrived" : `Doctor arriving in ${etaText}`}
                  </h4>
                  <p className="text-xs text-slate-500">Emergency Dispatch Case #{requestId}</p>
                </div>
                <button
                  onClick={() => setDetailsDrawerOpen(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Driver / Doctor Card */}
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold">
                    👨‍⚕️
                  </div>
                  <div>
                    <p className="font-bold text-ink">Dr. {status.doctor.name}</p>
                    <p className="text-xs text-slate-500">★ 4.8 · On-Call Emergency Physician</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-800">Toyota Vios</p>
                  <p className="text-[11px] text-slate-500">MED-8CF48</p>
                </div>
              </div>

              {/* PASSENGERS / PATIENT DETAILS (Contra Mockup Screen 3) */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">PATIENT DETAILS</p>
                <div className="mt-2 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between p-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                        {patientName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-ink">{patientName} (You)</p>
                        <p className="text-[11px] text-slate-400">{patientPhone || "Primary Patient"}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">1 patient</span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50/50">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                        🚑
                      </div>
                      <div>
                        <p className="text-xs font-bold text-ink">Emergency Attendant</p>
                        <p className="text-[11px] text-slate-400">Triage & Support Paramedic</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">1 unit</span>
                  </div>
                </div>

                <div className="mt-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
                  <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                  <p>Attending doctor will arrive with diagnostic equipment and conduct on-site clinical triage.</p>
                </div>
              </div>

              {/* TRIP TIMELINE (Contra Mockup Screen 3) */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">EMERGENCY TRIP TIMELINE</p>
                <div className="mt-2 space-y-3 pl-2">
                  <div className="flex items-start gap-3">
                    <span className="h-3 w-3 rounded-full bg-emerald-500 shrink-0 mt-1" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-ink">{addressDisplay.split("(")[0]}</p>
                      <p className="text-[11px] text-slate-400">Pickup Location · Alert Dispatched</p>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {status.createdAt ? new Date(status.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Active"}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className={`h-3 w-3 rounded-full shrink-0 mt-1 ${arrived ? "bg-emerald-500" : "bg-slate-300"}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-ink">Doctor Arrival & Verification</p>
                      <p className="text-[11px] text-slate-400">Doctor arrives at your gate/residence</p>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {arrived ? "Arrived" : "En route"}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="h-3 w-3 rounded-full bg-slate-300 shrink-0 mt-1" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-ink">{destinationText}</p>
                      <p className="text-[11px] text-slate-400">Clinical Evaluation & Stabilization</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    setDetailsDrawerOpen(false);
                    setMessageModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-[#1FD186] py-3 text-xs font-bold text-slate-900"
                >
                  <MessageSquare className="h-4 w-4" /> MESSAGE
                </button>
                <a
                  href={status.doctor.phone ? `tel:${status.doctor.phone}` : `tel:${supportPhone}`}
                  className="flex items-center justify-center gap-2 rounded-2xl border-2 border-[#1FD186] bg-white py-3 text-xs font-bold text-slate-900"
                >
                  <Phone className="h-4 w-4 text-[#10B981]" /> CALL
                </a>
              </div>

              {/* Cancel Request Option */}
              <button
                onClick={async () => {
                  if (confirm("Are you sure you want to cancel this emergency request?")) {
                    setCancelling(true);
                    await cancelSos(requestId);
                    setCancelling(false);
                    setDetailsDrawerOpen(false);
                    resetRequest();
                  }
                }}
                disabled={cancelling}
                className="w-full text-center text-xs font-semibold text-red-600 hover:text-red-700 py-1"
              >
                {cancelling ? "Cancelling…" : "Cancel emergency request"}
              </button>
            </div>
          </div>
        )}

        {/* ── IN-APP MESSAGING MODAL ── */}
        {messageModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl flex flex-col h-[70vh]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm">
                    👨‍⚕️
                  </span>
                  <div>
                    <h4 className="font-bold text-ink text-sm">Dr. {status.doctor.name}</h4>
                    <p className="text-[10px] text-emerald-600 font-semibold">Online · En Route</p>
                  </div>
                </div>
                <button
                  onClick={() => setMessageModalOpen(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Quick Template Chips */}
              <div className="py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  "Patient is conscious",
                  "Call when at gate",
                  "Flat #204, 2nd floor",
                  "Waiting outside",
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => {
                      setMessages((prev) => [
                        ...prev,
                        {
                          text: chip,
                          sender: "patient",
                          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        },
                      ]);
                    }}
                    className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-700"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Message thread */}
              <div className="flex-1 overflow-y-auto space-y-2.5 p-2">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${m.sender === "patient" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                        m.sender === "patient"
                          ? "bg-brand-700 text-white rounded-br-none"
                          : "bg-slate-100 text-slate-800 rounded-bl-none"
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5 px-1">{m.time}</span>
                  </div>
                ))}
              </div>

              {/* Message input */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <input
                  type="text"
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type emergency note for doctor…"
                  className="flex-1 rounded-xl bg-slate-100 px-3.5 py-2.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand-700"
                />
                <button
                  onClick={handleSendMessage}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white transition hover:bg-brand-800"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // State C: Completed & Rating
  if (requestId && status?.status === "completed" && status.rating == null) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border-2 border-emerald-300 bg-white p-6 text-center shadow-float space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 text-2xl">
          ✓
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-ink">Emergency Visit Completed</h3>
          <p className="text-xs text-slate-500 mt-1">
            {status.fare != null ? `Settled at ₹${Number(status.fare).toLocaleString("en-IN")}` : "Case resolved"}
          </p>
        </div>

        <p className="text-xs font-semibold text-slate-700">How was your attending doctor?</p>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              className={`text-3xl transition ${rating >= n ? "text-amber-500" : "text-slate-200"}`}
            >
              ★
            </button>
          ))}
        </div>
        {ratingError && <p className="text-xs text-red-600">{ratingError}</p>}

        <button
          onClick={async () => {
            if (rating === 0) {
              setRatingError("Please select a rating.");
              return;
            }
            setRatingBusy(true);
            const res = await rateSosCase(requestId, rating, "");
            if (res.error) setRatingError(res.error);
            else resetRequest();
            setRatingBusy(false);
          }}
          disabled={ratingBusy}
          className="w-full rounded-2xl bg-brand-700 py-3 text-sm font-bold text-white transition hover:bg-brand-800"
        >
          {ratingBusy ? "Submitting…" : "Complete & Dismiss"}
        </button>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // State D: PRE-BOOKING & EMERGENCY TIERS (Contra Mockup Screen 1)
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="mx-auto max-w-md space-y-4">
      {/* Top Location Inputs (Contra Mockup Screen 1 Origin/Destination Card) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft space-y-3">
        {/* Origin Pill */}
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 rounded-full bg-emerald-500 shrink-0 ring-4 ring-emerald-100" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PATIENT PICKUP</p>
            <p className="truncate text-xs font-bold text-ink">
              {addressDisplay}
            </p>
          </div>
          <button
            onClick={() => {
              setLocating(true);
              getPosition()
                .then((pos) => {
                  setCoords(pos);
                  setLocating(false);
                  setAddressDisplay(`${pos.lat.toFixed(4)}° N, ${pos.lng.toFixed(4)}° E`);
                })
                .catch(() => setLocating(false));
            }}
            className="text-[11px] font-bold text-brand-700 hover:text-brand-600 shrink-0"
          >
            {locating ? "Locating…" : "Refresh"}
          </button>
        </div>

        <div className="h-px bg-slate-100 ml-6" />

        {/* Destination / Facility Pill */}
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 rounded-full border-2 border-teal-500 shrink-0 bg-teal-50" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">DESTINATION / TREATMENT</p>
            <input
              type="text"
              value={destinationText}
              onChange={(e) => setDestinationText(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-ink focus:outline-none"
              placeholder="e.g. On-Site Treatment or Hospital Name"
            />
          </div>
        </div>
      </div>

      {/* Emergency Problem / Symptoms Description */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
        <label htmlFor="sos-problem-input" className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
          EMERGENCY COMPLAINT / SYMPTOMS
        </label>
        <textarea
          id="sos-problem-input"
          value={complaintText}
          onChange={(e) => setComplaintText(e.target.value)}
          rows={2}
          maxLength={300}
          placeholder="Describe what is happening (e.g. severe chest pain, fall, breathing issue...)"
          className="mt-1.5 w-full resize-none text-xs text-ink placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      {/* SUGGESTED RIDES / EMERGENCY TIERS (Contra Mockup Screen 1 Suggested Rides List) */}
      <div className="space-y-2">
        <p className="px-1 text-xs font-bold uppercase tracking-wider text-slate-400">SUGGESTED RESPONSE UNITS</p>

        <div className="space-y-2.5">
          {EMERGENCY_TIERS.map((tier) => {
            const isSelected = selectedTier === tier.id;

            if (isSelected) {
              // Active / Selected Card: Dark Theme with Mint Border (Contra Mockup Screen 1 Deluxe Card)
              return (
                <div
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                  className="relative cursor-pointer overflow-hidden rounded-3xl bg-slate-900 p-4 text-white shadow-lift ring-2 ring-emerald-400/80 transition transform active:scale-[0.99]"
                >
                  {tier.badge && (
                    <span className="absolute top-2.5 right-4 rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white">
                      {tier.badge}
                    </span>
                  )}
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-2xl">
                      {tier.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-extrabold text-sm tracking-wide text-white">{tier.name}</h4>
                        <span className="text-[10px] text-emerald-400 font-semibold">ETA {tier.etaDisplay}</span>
                      </div>
                      <p className="truncate text-xs text-slate-300 mt-0.5">{tier.subtitle}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-display text-sm font-bold text-emerald-400">₹{tier.priceEstimate}</p>
                      <p className="text-[9px] text-slate-400">Base est.</p>
                    </div>
                  </div>
                </div>
              );
            }

            // Normal / Unselected Card
            return (
              <div
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className="cursor-pointer rounded-3xl border border-slate-200/80 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50/50"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                    {tier.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-bold text-xs tracking-wide text-ink">{tier.name}</h4>
                      <span className="text-[10px] text-slate-400">ETA {tier.etaDisplay}</span>
                    </div>
                    <p className="truncate text-xs text-slate-500 mt-0.5">{tier.subtitle}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display text-xs font-bold text-ink">₹{tier.priceEstimate}</p>
                    <p className="text-[9px] text-slate-400">Base est.</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Booking Action Strip (Contra Mockup Screen 1 Bottom Bar) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft space-y-3">
        {/* Payment selector row */}
        <div className="flex items-center justify-between text-xs text-slate-600 px-1">
          <div className="flex items-center gap-2">
            <span className="rounded bg-brand-700 px-1.5 py-0.5 text-[10px] font-bold text-white">VISA</span>
            <span className="font-mono font-semibold text-ink">•••• 7539</span>
          </div>
          <span className="text-[11px] font-semibold text-brand-700">Cash / Insurance accepted</span>
        </div>

        {/* Big Prominent Action Button */}
        <button
          onClick={handleRaiseSos}
          disabled={pending || locating}
          className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1FD186] py-4 text-base font-extrabold text-slate-950 transition hover:bg-[#1bc07b] shadow-lift active:scale-[0.99]"
        >
          {pending || locating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Dispatching Alert…
            </>
          ) : (
            <>
              <HeartPulse className="h-5 w-5" /> RAISE SOS ALERT
            </>
          )}
        </button>

        <p className="text-center text-[11px] text-slate-400">
          Alerts all on-duty emergency physicians & response units within {SOS_RADIUS_KM} km.
        </p>
      </div>
    </div>
  );
}
