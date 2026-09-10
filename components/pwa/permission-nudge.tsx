"use client";

import { useEffect, useState } from "react";
import { BellRing, MapPin, ShieldCheck, X } from "lucide-react";

/**
 * Post-login permission nudge: a one-time card that asks the user to grant
 * notifications + location so SOS dispatch and alerts work.
 *
 * Platform reality:
 * - Notification.requestPermission() can be called directly (user gesture
 *   not required for the browser prompt).
 * - Geolocation CANNOT be pre-requested — the browser only shows its prompt
 *   on an actual getCurrentPosition call, so we warm it up here.
 * - Camera/mic are disabled app-wide by the CSP permissions-policy; never ask.
 * - iOS Safari only supports notifications inside an installed PWA; the card
 *   detects that and shows install guidance instead of a dead button.
 *
 * Dismissal is remembered in localStorage (per browser). A "denied" state is
 * respected — the card hides and never nags again for that permission.
 */

const DISMISS_KEY = "skoracare-perms-dismissed";
const LOCATE_KEY = "skoracare-perms-located";

type PermState = "unknown" | "granted" | "denied" | "unsupported";

export function PermissionNudge() {
  const [visible, setVisible] = useState(false);
  const [notif, setNotif] = useState<PermState>("unknown");
  const [loc, setLoc] = useState<PermState>("unknown");

  // Read browser permission state once on mount (async via rAF so no
  // cascading synchronous renders — these are external-system reads).
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      if (window.localStorage.getItem(DISMISS_KEY)) return;
      if (window.localStorage.getItem(LOCATE_KEY)) {
        setVisible(false);
        return;
      }
      if (typeof Notification === "undefined") setNotif("unsupported");
      else
        setNotif(
          Notification.permission === "granted"
            ? "granted"
            : Notification.permission === "denied"
              ? "denied"
              : "unknown"
        );
      if (!("geolocation" in navigator)) setLoc("unsupported");
      else
        navigator.permissions
          ?.query({ name: "geolocation" })
          .then((s) => setLoc(s.state as PermState))
          .catch(() => setLoc("unknown"));
      setVisible(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  async function askNotifications() {
    if (typeof Notification === "undefined") return;
    const res = await Notification.requestPermission().catch(() => "denied");
    setNotif(res === "granted" ? "granted" : res === "denied" ? "denied" : "unknown");
    if (res === "granted") {
      // Re-register push subscription so SOS alerts reach this device.
      const reg = await navigator.serviceWorker?.getRegistration().catch(() => null);
      if (reg) {
        const existing = await reg.pushManager.getSubscription().catch(() => null);
        if (existing) return;
        const { urlBase64ToUint8Array } = await import("@/lib/push/client-utils");
        const { subscribeToPush } = await import("@/lib/push/actions");
        const sub = await reg.pushManager
          .subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""),
          })
          .catch(() => null);
        if (sub) {
          const json = sub.toJSON();
          if (json.endpoint && json.keys) {
            void subscribeToPush(json.endpoint, json.keys.auth ?? "", json.keys.p256dh ?? "").catch(() => {});
          }
        }
      }
    }
  }

  function askLocation() {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      () => {
        window.localStorage.setItem(LOCATE_KEY, "1");
        setLoc("granted");
        setVisible(false); // Both asked → hide the card
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setLoc("denied");
        else {
          // Timeout/unavailable ≠ denied — treat as granted-warm-up anyway.
          window.localStorage.setItem(LOCATE_KEY, "1");
          setLoc("granted");
          setVisible(false);
        }
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  if (!visible || (notif === "granted" && (loc === "granted" || loc === "unsupported"))) return null;

  const notifBlocked = notif === "denied" || notif === "unsupported";
  const notifGranted = notif === "granted";
  const locGranted = loc === "granted" || loc === "unsupported";

  // Detect iOS Safari outside an installed PWA — notifications are impossible
  // there; show guidance instead of a button that does nothing.
  const isIosStandalone =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window.matchMedia?.("(display-mode: standalone)")?.matches ?? false);

  return (
    <div className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-md rounded-2xl border-2 border-brand-200 bg-white p-4 shadow-2xl lg:inset-x-auto lg:right-6 lg:bottom-6 lg:translate-x-0">
      <button onClick={dismiss} className="absolute right-2 top-2 rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Dismiss">
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-brand-700" />
        <p className="text-sm font-bold text-ink">Enable permissions</p>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        So SOS alerts and live location work when you need them.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {!notifGranted && (
          <button
            onClick={askNotifications}
            disabled={notifBlocked && !isIosStandalone}
            className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold ${
              notifBlocked && !isIosStandalone
                ? "bg-slate-100 text-slate-400"
                : "bg-brand-700 text-white hover:bg-brand-800"
            }`}
          >
            <BellRing className="h-3.5 w-3.5" />
            {notif === "denied"
              ? "Blocked in browser"
              : isIosStandalone && notifBlocked
                ? "Install app first"
                : "Allow alerts"}
          </button>
        )}
        {!locGranted && (
          <button
            onClick={askLocation}
            disabled={loc === "denied"}
            className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold ${
              loc === "denied"
                ? "bg-slate-100 text-slate-400"
                : "bg-brand-700 text-white hover:bg-brand-800"
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            {loc === "denied" ? "Blocked in browser" : "Allow location"}
          </button>
        )}
      </div>

      {isIosStandalone && notifBlocked && (
        <p className="mt-2 text-[11px] leading-snug text-slate-400">
          On iPhone/iPad: Share → Add to Home Screen, then enable notifications inside the installed app.
        </p>
      )}

      {(notifGranted || locGranted) && (
        <button onClick={dismiss} className="mt-2 w-full text-center text-[11px] font-semibold text-brand-700 hover:text-brand-600">
          Done — dismiss
        </button>
      )}
    </div>
  );
}
