"use client";

import { useState } from "react";

type PincodeData = {
  district: string;
  state: string;
  postOffices: string[];
  cached: boolean;
};

/** PIN helper under the pincode input: looks up district/state, one-click apply. */
export function PincodeAutofillHint() {
  const [status, setStatus] = useState<string | null>(null);
  const [data, setData] = useState<PincodeData | null>(null);
  const [busy, setBusy] = useState(false);

  async function lookup() {
    const el = document.getElementById("pincode") as HTMLInputElement | null;
    const pin = (el?.value ?? "").trim();
    if (!/^[1-9][0-9]{5}$/.test(pin)) {
      setStatus("Enter a 6-digit pincode first.");
      setData(null);
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/integrations/pincode?pincode=${pin}`);
      if (!res.ok) throw new Error("lookup failed");
      const json = (await res.json()) as PincodeData;
      setData(json);
      setStatus(
        json.district || json.state
          ? `Found: ${[json.district, json.state].filter(Boolean).join(", ")}${json.cached ? " (cached)" : ""}`
          : "No record for this PIN — you can still save."
      );
    } catch {
      setStatus("PIN lookup unavailable — you can still save.");
      setData(null);
    } finally {
      setBusy(false);
    }
  }

  function apply() {
    if (!data) return;
    const city = document.getElementById("city") as HTMLInputElement | null;
    const state = document.getElementById("state") as HTMLInputElement | null;
    if (city && data.district && !city.value) city.value = data.district;
    if (state && data.state && !state.value) state.value = data.state;
    setStatus("Applied district/state (only filled empty fields).");
  }

  return (
    <div className="mt-1 text-xs">
      <div className="flex items-center gap-2">
        <button type="button" onClick={lookup} disabled={busy} className="underline text-brand-700 disabled:opacity-50">
          {busy ? "Looking up…" : "Look up PIN"}
        </button>
        {data && (data.district || data.state) && (
          <button type="button" onClick={apply} className="underline text-brand-700">
            Apply {data.district || data.state}
          </button>
        )}
      </div>
      {status && <p className="mt-1 text-slate-500">{status}</p>}
    </div>
  );
}
