"use client";

import { useState } from "react";

type Item = { title: string; authors: string; source: string; year: string; url: string };

/** Doctor-only literature search drawer. Reference only — never a diagnosis. */
export function ReferenceSearch() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function search() {
    if (q.trim().length < 3) {
      setMsg("Type at least 3 characters (a clinical topic, never patient data).");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/integrations/reference?q=${encodeURIComponent(q.trim())}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "search failed");
      setItems(json.results ?? []);
      if ((json.results ?? []).length === 0) setMsg("No references found.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Search unavailable.");
      setItems([]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold">Reference search</p>
      <p className="text-xs text-slate-500">Read-only literature (Europe PMC / OpenAlex). Reference only — not a diagnosis.</p>
      <div className="mt-2 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), search())}
          placeholder="e.g. hypertension guidelines"
          className="input flex-1"
          maxLength={120}
        />
        <button type="button" onClick={search} disabled={busy} className="btn-secondary">
          {busy ? "…" : "Search"}
        </button>
      </div>
      {msg && <p className="mt-2 text-xs text-slate-500">{msg}</p>}
      <ul className="mt-2 space-y-2">
        {items.map((it, i) => (
          <li key={i} className="text-xs">
            <a href={it.url} target="_blank" rel="noreferrer" className="font-medium text-brand-700 underline">
              {it.title}
            </a>
            <span className="text-slate-500">
              {" "}— {it.authors} {it.source} {it.year}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
