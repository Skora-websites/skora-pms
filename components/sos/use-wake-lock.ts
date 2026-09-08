"use client";

import { useEffect } from "react";

/**
 * Keep the screen awake while `active` is true (Screen Wake Lock API).
 *
 * Used during an active SOS case: the doctor's 5s GPS-sharing loop and the
 * patient's live-map tracker both die when the phone sleeps — holding a
 * wake lock minimizes that on Android and iOS (16.4+). Re-acquires
 * automatically when the tab becomes visible again; the OS may release
 * the lock at any time, which is safe (we simply stop tracking).
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    if (!("wakeLock" in navigator)) return;

    let lock: WakeLockSentinel | null = null;
    let released = false;

    const acquire = async () => {
      if (released || lock) return;
      try {
        lock = await navigator.wakeLock.request("screen");
        lock.addEventListener("release", () => {
          lock = null;
        });
      } catch {
        /* denied or unsupported — tracking still works in foreground */
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") void acquire();
    };

    void acquire();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisibility);
      try {
        void lock?.release();
      } catch {
        /* already released */
      }
      lock = null;
    };
  }, [active]);
}
