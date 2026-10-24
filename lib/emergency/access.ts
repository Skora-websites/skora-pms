/**
 * Native-app detection for the Emergency dispatch feature.
 *
 * Emergency booking + doctor alerts run ONLY inside the SkoraCare mobile
 * application (a Capacitor shell around this same web bundle — see
 * docs/probes/probe3-capacitor.md). Browsers — desktop, and installed PWAs
 * alike — get the "download our mobile app" notice instead.
 *
 * The Capacitor JS bridge is the signal: a PWA served from the web has no
 * `window.Capacitor`, and iOS standalone ("Add to Home Screen") is exactly
 * the PWA case we exclude — `navigator.standalone` there is true, but the
 * native bridge is absent, so it stays gated.
 *
 * Client-only by construction: during SSR this returns false, which is the
 * safe default (the gate renders until the client says otherwise).
 */

type CapacitorBridge = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
};

declare global {
  interface Window {
    Capacitor?: CapacitorBridge;
  }
}

/** True only inside the native Android/iOS shell. */
export function isNativeEmergencyApp(): boolean {
  if (typeof window === "undefined") return false;
  const cap = window.Capacitor;
  if (!cap) return false;
  if (cap.isNativePlatform?.() !== true) return false;
  const platform = cap.getPlatform?.();
  return platform === "android" || platform === "ios";
}
