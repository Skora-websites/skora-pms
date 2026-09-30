"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";

export function AiSummaryButton({ bookingId, reportName }: { bookingId: number; reportName: string }) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Escape closes the modal; Tab is trapped inside the dialog while open.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !modalRef.current) return;
      const focusables = modalRef.current.querySelectorAll<HTMLElement>(
        'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    // Move focus into the dialog on open (basic focus trap entry point).
    modalRef.current?.querySelector<HTMLElement>("button")?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function summarize() {
    if (summary) {
      setOpen(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/patient/test-reports/${bookingId}/summarize`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      setSummary(data.summary ?? "Could not summarize this report.");
      setHighlights(data.highlights ?? []);
      setOpen(true);
    } catch {
      setError("Could not generate summary.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={summarize}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {loading ? "Summarizing…" : "Report Summary"}
      </button>

      {open && summary && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Report summary · ${reportName}`}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" ref={modalRef} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-600" />
                <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">Report Summary · {reportName}</h3>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            {highlights.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {highlights.map((h) => (
                  <span key={h} className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">{h}</span>
                ))}
              </div>
            )}
            <p className="mt-4 text-sm leading-relaxed text-slate-700">{summary}</p>
            <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
              ⚠ Informational summary only. Always consult your doctor for interpretation.
            </p>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </>
  );
}