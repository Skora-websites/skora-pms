"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Global error boundary.
 *
 * Styled to the app's own forest-green palette (audit R2) — this is the one
 * screen guaranteed to appear during a failure, and it used to render in
 * generic blue/red. The digest is shown in every environment rather than only
 * in dev: it is the only string that lets a user's "it broke" report be traced
 * back to a specific server-side stack.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an observability service in production.
    console.error("Unhandled error:", error);
  }, [error]);

  const [copied, setCopied] = useState(false);
  const copyDigest = async () => {
    if (!error.digest) return;
    try {
      await navigator.clipboard.writeText(error.digest);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-50 px-4 text-center">
      <div className="max-w-md">
        <h1 className="mb-3 text-6xl font-bold text-brand-800">500</h1>
        <h2 className="mb-4 text-2xl font-semibold text-brand-900">
          Something went wrong
        </h2>
        <p className="mb-8 text-slate-600">
          Please try again. If the problem persists, share the reference below
          with support.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-full bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-full border border-brand-200 px-6 py-2.5 text-sm font-medium text-brand-800 transition hover:bg-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            Go home
          </Link>
        </div>
        {error.digest && (
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white py-1.5 pl-3.5 pr-1.5">
            <span className="font-mono text-xs text-slate-500">
              ref {error.digest.slice(0, 18)}
            </span>
            <button
              onClick={copyDigest}
              className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 transition hover:bg-brand-100"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
