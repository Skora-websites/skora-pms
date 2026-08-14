"use client";

import { useEffect } from "react";
import Link from "next/link";

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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md">
        <h1 className="mb-2 text-6xl font-bold text-red-600">500</h1>
        <h2 className="mb-4 text-2xl font-semibold text-gray-800">
          Something went wrong
        </h2>
        <p className="mb-8 text-gray-600">
          We encountered an unexpected error. Please try again, and if the
          problem persists, contact support.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Go home
          </Link>
        </div>
        {process.env.NODE_ENV === "development" && error.digest && (
          <p className="mt-6 text-xs text-gray-400">
            Error digest: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}