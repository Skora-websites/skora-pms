"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Smartphone } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { isNativeEmergencyApp } from "@/lib/emergency/access";
import { APP_DOWNLOAD_LABEL, APP_DOWNLOAD_URL } from "@/lib/config";
import { cn } from "@/lib/utils";

const COPY = {
  patient: {
    title: "Emergency SOS is app-only",
    body: "Booking an emergency visit — live doctor tracking, arrival codes, instant billing — happens in the SkoraCare mobile app.",
    cta: APP_DOWNLOAD_LABEL,
    clickToast: "Emergency SOS runs in the SkoraCare mobile app. Please download our mobile application to book an emergency visit.",
  },
  doctor: {
    title: "Emergency dispatch is app-only",
    body: "Receiving and accepting emergency requests — with live patient tracking, arrival codes and billing — happens in the SkoraCare doctor app.",
    cta: "Get the doctor app",
    clickToast:
      "Emergency dispatch runs in the SkoraCare doctor app. Please download our mobile application to receive and accept emergency requests.",
  },
} as const;

/**
 * Whether the Emergency feature is available here. `null` until the client
 * resolves the native bridge (SSR + pre-hydration) — callers render nothing
 * rather than flashing the gate to a native user.
 */
export function useEmergencyAccess(): { available: boolean | null; refresh: () => void } {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    // Deferred one tick: the cascading-render rule forbids synchronous
    // setState in effects, and the bridge is only readable post-mount.
    const recheck = () => setAvailable(isNativeEmergencyApp());
    const t = setTimeout(recheck, 0);
    // The Capacitor bridge can initialize slightly after first paint (and
    // re-injects on app resume) — re-resolve on focus/visibility so a late
    // bridge flips the UI instead of stranding a native user on the notice.
    window.addEventListener("focus", recheck);
    document.addEventListener("visibilitychange", recheck);
    return () => {
      clearTimeout(t);
      window.removeEventListener("focus", recheck);
      document.removeEventListener("visibilitychange", recheck);
    };
  }, []);

  return { available, refresh: () => setAvailable(isNativeEmergencyApp()) };
}

/**
 * Guard for every Emergency click target. Inside the native app: returns
 * true so the caller proceeds. In any browser (desktop or installed PWA):
 * fires the "download our mobile app" TOAST and returns false, so the
 * caller must not proceed.
 */
export function useEmergencyGate(): (surface: "patient" | "doctor") => boolean {
  const { notify } = useToast();

  return (surface) => {
    if (isNativeEmergencyApp()) return true;
    notify({ title: COPY[surface].clickToast, tone: "warning", ttl: 6000 });
    return false;
  };
}

/**
 * Persistent notice shown wherever Emergency surfaces on a browser
 * (desktop or installed PWA): the feature stays visible, but locked to
 * the mobile app — clicking gives the download notification.
 */
export function EmergencyAppOnly({
  surface,
  className,
}: {
  surface: "patient" | "doctor";
  className?: string;
}) {
  const { available } = useEmergencyAccess();
  const { notify } = useToast();

  if (available === null || available) return null;

  const copy = COPY[surface];

  return (
    <div
      className={cn(
        "rounded-3xl border-2 border-dashed border-brand-200 bg-white p-6 text-center shadow-soft",
        className
      )}
    >
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        <Smartphone className="h-7 w-7" />
      </span>
      <h2 className="mt-4 font-display text-lg font-bold text-ink">{copy.title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-muted">{copy.body}</p>
      <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
        <Link href={APP_DOWNLOAD_URL} className="btn-primary justify-center">
          {copy.cta}
        </Link>
        <button
          onClick={() =>
            notify({
              title: "Mobile app required",
              body: "This feature is not accessible on desktop or the PWA — please download our mobile application.",
              tone: "warning",
              ttl: 6000,
            })
          }
          className="btn-secondary justify-center text-xs"
        >
          Why can&apos;t I use this here?
        </button>
      </div>
    </div>
  );
}
