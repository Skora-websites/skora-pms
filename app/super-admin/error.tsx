"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

/**
 * Segment-level error boundary — rendered inside the super-admin
 * DashboardShell so a failed query (e.g. a DB hiccup on a page's
 * Promise.all) keeps the sidebar/header navigation; the root app/error.tsx
 * replaces the whole screen as a last resort. Same pattern as the
 * doctor/patient/admin segment boundaries (F-02).
 */
export default function SuperAdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Super-admin dashboard error:", error);
  }, [error]);

  return (
    <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-[17px] font-semibold tracking-[-0.01em] text-ink">
        Something went wrong
      </h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        We hit an unexpected error loading this page. Try again, or head back to your dashboard.
      </p>
      <div className="mt-5 flex items-center gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link
          href="/super-admin"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-800"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
