"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { IndiaKind } from "@/lib/integrations/india/types";

type Suggestion = {
  id: string;
  label: string;
  detail?: string;
  code?: string | null;
  namaste?: string | null;
  category?: string;
  form?: string;
  strength?: string;
};

const KIND_HINT: Record<IndiaKind, string> = {
  medicines: "Indian medicines",
  symptoms: "Clinical terms",
  examinations: "Examination findings",
  diagnoses: "Diagnoses (ICD-10)",
  "lab-tests": "Lab tests",
  history: "History items",
  instructions: "Instruction templates",
};

/** Human label for the source that actually served the results. */
const SOURCE_LABEL: Record<string, string> = {
  dataset: "committed Indian snapshot",
  "nlm-icd10cm": "NLM ICD-10-CM · live, no key",
  "nlm-conditions": "NLM conditions · live, no key",
  "nlm-rxterms+dataset": "NLM RxTerms + Indian brands · live, no key",
  "live+dataset": "operator gateway + snapshot",
};

/**
 * Debounced suggestion picker over the same-origin India route
 * (/api/integrations/india). Advisory-only mirror of the master search:
 * hides itself on any non-OK response (disabled, unauthenticated, empty)
 * so the textarea it feeds always stays usable on its own.
 */
export function IndiaPicker({
  kind,
  onAdd,
  placeholder,
}: {
  kind: IndiaKind;
  onAdd: (text: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState("dataset");
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    clearTimeout(timeoutRef.current);
    const q = query.trim();
    // Short query: nothing scheduled and no state reset — the dropdown's
    // visibility is derived during render (below), so stale results are
    // simply not shown.
    if (q.length < 2) return;
    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/integrations/india?kind=${kind}&q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = (await res.json()) as { items: Suggestion[]; provider?: string };
          setResults(data.items ?? []);
          setSource(data.provider ?? "dataset");
          setOpen(data.items.length > 0);
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
    }, 300);
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [query, kind]);

  const pick = (item: Suggestion) => {
    onAdd(item.label);
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder ?? `Search ${KIND_HINT[kind]}…`}
          className="input !pl-9"
          aria-label={`Search ${KIND_HINT[kind]}`}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">…</span>
        )}
      </div>
      {open && query.trim().length >= 2 && results.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {results.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => pick(item)}
                className="flex w-full items-start justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">{item.label}</span>
                  {item.detail && <span className="block truncate text-xs text-ink-muted">{item.detail}</span>}
                </span>
                {(item.code || item.namaste) && (
                  <span className="shrink-0 text-[10px] font-mono text-slate-400">
                    {[item.code, item.namaste].filter(Boolean).join(" · ")}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && (
        <p className="mt-1 text-[10px] text-slate-400">
          {SOURCE_LABEL[source] ?? source} · verify before prescribing
        </p>
      )}
    </div>
  );
}
