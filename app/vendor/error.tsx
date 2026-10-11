"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Segment-level error boundary for the vendor upload-test flow. Without it a
 * throw inside the page or its upload action bubbles to the root app/error.tsx
 * and the vendor loses the upload context entirely.
 */
export default function VendorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Vendor upload error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="card flex w-full max-w-md flex-col items-center justify-center px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-[17px] font-semibold tracking-[-0.01em] text-ink">
          Upload failed
        </h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          We hit an unexpected error loading this upload link. Try again, or ask the clinic
          to regenerate the link.
        </p>
        <button type="button" onClick={reset} className="btn-primary mt-5">
          Try again
        </button>
      </div>
    </div>
  );
}
