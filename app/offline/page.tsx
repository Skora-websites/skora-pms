import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline · SkoraCares",
  robots: { index: false },
};

/**
 * Offline fallback (PWA). The service worker serves this page for any
 * navigation request that fails while the network is down — the app is
 * network-first, but a dead connection must show a branded screen, never
 * the browser's error page. Recovery is one tap: reload when the
 * connection returns.
 */
export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-surface px-8 text-center">
      <span
        aria-hidden="true"
        className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-brand-700 shadow-float"
      >
        <svg viewBox="0 0 512 512" className="h-10 w-10">
          <rect x="214" y="112" width="84" height="288" rx="24" fill="#ffffff" />
          <rect x="112" y="214" width="288" height="84" rx="24" fill="#ffffff" />
        </svg>
      </span>
      <h1 className="mt-6 font-display text-2xl font-bold text-ink">You&apos;re offline</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
        SkoraCare needs a connection to load your clinic data. Check your network and try again —
        your account is still signed in.
      </p>
      <form action="/offline" method="get" className="mt-6">
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-800 active:scale-95"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
          Try again
        </button>
      </form>
    </main>
  );
}
