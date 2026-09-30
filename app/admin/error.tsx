"use client";

import { useEffect } from "react";

/**
 * Admin segment error boundary — stays INSIDE the DashboardShell (the root
 * app/error.tsx ejects users from all dashboard chrome), matching the
 * segment-level boundaries the doctor dashboard added after F-02.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] segment error:", error);
  }, [error]);

  return (
    <div className="card mx-auto max-w-lg p-10 text-center">
      <h2 className="text-lg font-bold text-ink">Something went wrong</h2>
      <p className="mt-2 text-sm text-slate-500">
        This view failed to load. Your data is safe — try again.
      </p>
      <button onClick={reset} className="mt-6 btn-primary">
        Try again
      </button>
    </div>
  );
}
