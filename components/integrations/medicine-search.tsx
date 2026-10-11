"use client";

import { useEffect, useRef, useState } from "react";

type Suggestion = { rxcui: string; name: string; score: string };
type LabelInfo = {
  brandName: string;
  genericName: string;
  indications: string | null;
  boxedWarning: boolean;
};
type Recall = { product: string; reason: string; classification: string; status: string };

/**
 * External medicine lookup (RxNav + openFDA, no-key, server-side route).
 * Advisory-only: inserts the verified name into the prescription textarea.
 * Degrades silently — the master-list search above it always works.
 */
export function ExternalMedicineSearch({ onAdd }: { onAdd: (name: string) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [label, setLabel] = useState<Record<string, LabelInfo | null>>({});
  const [recalls, setRecalls] = useState<Record<string, Recall[]>>({});
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      const q = query.trim();
      if (q.length < 2) {
        setResults([]);
        setOpen(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/integrations/medicines?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = (await res.json()) as { medicines: Suggestion[] };
          setResults(data.medicines ?? []);
          setOpen(true);
          setUnavailable(false);
        } else if (res.status === 503) {
          setUnavailable(true);
          setOpen(false);
        } else {
          setResults([]);
          setOpen(false);
        }
      } catch {
        setResults([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query]);

  const toggleInfo = async (m: Suggestion) => {
    if (expanded === m.rxcui) {
      setExpanded(null);
      return;
    }
    setExpanded(m.rxcui);
    if (!(m.name in label)) {
      try {
        const [lr, rr] = await Promise.all([
          fetch(`/api/integrations/medicines?mode=label&q=${encodeURIComponent(m.name)}`),
          fetch(`/api/integrations/medicines?mode=recall&q=${encodeURIComponent(m.name)}`),
        ]);
        if (lr.ok) {
          const d = (await lr.json()) as { label: LabelInfo | null };
          setLabel((p) => ({ ...p, [m.name]: d.label }));
        } else {
          setLabel((p) => ({ ...p, [m.name]: null }));
        }
        if (rr.ok) {
          const d = (await rr.json()) as { recalls: Recall[] };
          setRecalls((p) => ({ ...p, [m.name]: d.recalls ?? [] }));
        }
      } catch {
        setLabel((p) => ({ ...p, [m.name]: null }));
      }
    }
  };

  const pick = (name: string) => {
    onAdd(name);
    setQuery("");
    setResults([]);
    setOpen(false);
    setExpanded(null);
  };

  if (unavailable) return null;

  return (
    <div>
      <label className="label">Search global drug database (RxNav / FDA, advisory)</label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input"
          placeholder="e.g. paracetamol, ibuprofen…"
          aria-label="Search global drug database"
        />
        {open && (
          <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            {loading && <li className="px-3 py-2 text-sm text-slate-400">Searching…</li>}
            {!loading && results.length === 0 && (
              <li className="px-3 py-2 text-sm text-slate-400">
                No match — US-centric data, Indian brands often miss. Type the name manually below.
              </li>
            )}
            {results.map((m) => (
              <li key={m.rxcui} className="border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => pick(m.name)}
                    className="flex-1 text-left text-sm text-slate-700 hover:text-ink"
                  >
                    {m.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleInfo(m)}
                    className="shrink-0 rounded-md border border-slate-200 px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-50"
                    aria-label={`Info for ${m.name}`}
                  >
                    {expanded === m.rxcui ? "Hide" : "Info"}
                  </button>
                </div>
                {expanded === m.rxcui && (
                  <div className="px-3 pb-2 text-xs text-slate-500">
                    {m.name in label ? (
                      <>
                        {label[m.name]?.boxedWarning && (
                          <p className="mb-1 rounded-md bg-red-50 px-2 py-1 font-medium text-red-700">
                            FDA boxed warning on file — read the label before prescribing.
                          </p>
                        )}
                        {label[m.name]?.indications ? (
                          <p className="mb-1 line-clamp-3">Use: {label[m.name]?.indications}</p>
                        ) : (
                          <p className="mb-1">No FDA label on file for this name.</p>
                        )}
                        {(recalls[m.name] ?? []).length > 0 && (
                          <p className="mb-1 font-medium text-amber-700">
                            {recalls[m.name].length} recall record(s), e.g. {recalls[m.name][0].classification} —{" "}
                            {recalls[m.name][0].status}.
                          </p>
                        )}
                      </>
                    ) : (
                      <p>Loading label info…</p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-1.5 text-xs text-slate-400">
        Reference only — verify before prescribing. Nothing here blocks saving the consultation.
      </p>
    </div>
  );
}
