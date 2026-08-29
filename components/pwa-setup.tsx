"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

/**
 * PWA setup (client-only):
 * - Registers the service worker (offline shell + Web Push).
 * - Captures the browser's install prompt (beforeinstallprompt) and shows an
 *   in-app "Install app" button.
 */
export function PwaSetup() {
  const [installPrompt, setInstallPrompt] = useState<{ prompt: () => Promise<void> } | null>(null);
  const [showInstall, setShowInstall] = useState(false);

  // Register service worker on mount.
  useEffect(() => {
    if ("serviceWorker" in navigator && window.location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Capture the install prompt (Android Chrome + desktop; iOS shows its own
  // "Add to Home Screen" flow).
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      // @ts-expect-error beforeinstallprompt is not in TS lib types yet
      setInstallPrompt(e);
      setShowInstall(true);
    };
    const onInstalled = () => setShowInstall(false);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setShowInstall(false);
  };

  if (!showInstall) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-2xl border border-brand-100 bg-white p-3 shadow-2xl lg:bottom-6">
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="SkoraCare" className="h-full w-full object-cover" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-900">Install SkoraCare</p>
        <p className="text-xs text-slate-500">Use it like a native app — no store needed.</p>
      </div>
      <button
        onClick={install}
        className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-brand-700 px-3 py-2 text-xs font-bold text-white hover:bg-brand-800"
      >
        <Download className="h-3.5 w-3.5" /> Install
      </button>
      <button onClick={() => setShowInstall(false)} className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Dismiss">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
