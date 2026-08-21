"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";

export function AiSummaryButton({ bookingId, reportName }: { bookingId: number; reportName: string }) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {loading ? "Summarizing…" : "AI Summary"}
      </button>

      {open && summary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-600" />
                <h3 className="font-display text-base font-bold text-slate-900">AI Summary · {reportName}</h3>
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