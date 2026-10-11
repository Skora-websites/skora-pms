"use client";

import { useState } from "react";

type Result = { lat: string; lon: string; displayName: string };

/** Verify a home-visit address on OpenStreetMap. Fills nothing — shows coords + map link. */
export function GeoVerifyButton({ getAddress }: { getAddress: () => string }) {
  const [results, setResults] = useState<Result[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function verify() {
    const address = getAddress().trim();
    if (address.length < 4) {
      setMsg("Enter a fuller address first.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/integrations/geocode?address=${encodeURIComponent(address)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "verify failed");
      setResults((json.results ?? []).slice(0, 3));
      if ((json.results ?? []).length === 0) setMsg("No match — check spelling or PIN.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Verification unavailable.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-xs">
      <button type="button" onClick={verify} disabled={busy} className="underline text-brand-700 disabled:opacity-50">
        {busy ? "Verifying…" : "Verify on map"}
      </button>
      {msg && <p className="mt-1 text-slate-500">{msg}</p>}
      {results.length > 0 && (
        <ul className="mt-1 space-y-1 text-slate-600">
          {results.map((r, i) => (
            <li key={i}>
              {r.displayName} ({r.lat}, {r.lon}) —{" "}
              <a
                href={`https://www.openstreetmap.org/?mlat=${r.lat}&mlon=${r.lon}#map=15/${r.lat}/${r.lon}`}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                open map
              </a>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-1 text-[11px] text-slate-400">© OpenStreetMap contributors</p>
    </div>
  );
}
