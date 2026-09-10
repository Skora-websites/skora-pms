"use client";

import { useEffect, useState } from "react";

/**
 * Branded splash: full-screen Clinical Bento canvas with the SkoraCare cross
 * logo pulsing + a mint sweep, shown once per browser session on first load.
 *
 * The heartbeat ring mirrors the SOS button's animate-ping; the cross fades
 * in with a scale bounce. Pure CSS — no JS animation cost on low-end phones.
 * Session-scoped via sessionStorage so refreshes within a session don't
 * re-show it, but a fresh visit (or app cold start) does.
 */

const SEEN_KEY = "skoracare-splash-seen";

export function SplashScreen() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Once-per-session check. The seen-flag is written only when the splash
    // COMPLETES — a StrictMode remount that cancels the first run must not
    // mark the session as seen before anything ever displayed.
    let shouldShow = false;
    try {
      shouldShow = !sessionStorage.getItem(SEEN_KEY);
    } catch {
      shouldShow = true; /* private mode — show anyway */
    }
    if (!shouldShow) return;

    const raf = requestAnimationFrame(() => setShow(true));
    const t = setTimeout(() => {
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* private mode */
      }
      setShow(false);
    }, 1600);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="splash-overlay" role="status" aria-label="Loading SkoraCare">
      <div className="splash-logo-wrap">
        {/* Ring echo */}
        <span className="splash-ring" />
        <span className="splash-ring splash-ring-delay" />
        {/* Cross mark — same geometry as icon-master.svg */}
        <svg viewBox="0 0 512 512" className="splash-logo" aria-hidden="true">
          <rect width="512" height="512" rx="112" fill="#0e382b" />
          <rect x="214" y="112" width="84" height="288" rx="24" fill="#ffffff" className="splash-cross-v" />
          <rect x="112" y="214" width="288" height="84" rx="24" fill="#ffffff" className="splash-cross-h" />
        </svg>
      </div>
      <p className="splash-title">SkoraCare</p>
      <p className="splash-sub">Clinic OS</p>
    </div>
  );
}
