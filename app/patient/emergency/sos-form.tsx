"use client";

import { useState, useTransition } from "react";
import { LocateFixed, Loader2, MapPin } from "lucide-react";
import { triggerSos } from "@/lib/dispatch/actions";
import { SosStatusTracker } from "./sos-status";

const COMPLAINTS = [
  "Chest pain",
  "Difficulty breathing",
  "Severe bleeding",
  "Unconscious / fainting",
  "Severe pain",
  "Accident / injury",
  "Other emergency",
];

export function SosForm() {
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [requestId, setRequestId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const detectLocation = () => {
    setLocating(true);
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Location not supported. Enter coordinates manually.");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => {
        setGeoError("Could not get your location. Enter coordinates manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await triggerSos({ error: null }, fd);
      if (res.error) setError(res.error);
      else if (res.requestId) setRequestId(res.requestId);
    });
  };

  if (requestId) return <SosStatusTracker requestId={requestId} />;

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <div>
        <h2 className="font-display text-base font-bold text-slate-900">Request urgent help</h2>
        <p className="text-xs text-slate-500">We&apos;ll alert nearby on-duty doctors and get help on the way.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Latitude</label>
          <input
            name="latitude"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            required
            className="input"
            placeholder="e.g. 28.6139"
            inputMode="decimal"
          />
        </div>
        <div>
          <label className="label">Longitude</label>
          <input
            name="longitude"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            required
            className="input"
            placeholder="e.g. 77.2090"
            inputMode="decimal"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={detectLocation}
        disabled={locating}
        className="btn-secondary w-full justify-center"
      >
        {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
        {locating ? "Locating…" : "Use my location"}
      </button>
      {geoError && <p className="text-xs text-red-600">{geoError}</p>}

      <div>
        <label className="label">Search radius</label>
        <select name="radius_km" className="input" defaultValue="10">
          <option value="5">Within 5 km</option>
          <option value="10">Within 10 km</option>
          <option value="20">Within 20 km</option>
        </select>
      </div>

      <div>
        <label className="label">What&apos;s the emergency?</label>
        <select name="complaint" className="input" defaultValue="">
          <option value="" disabled>Select…</option>
          {COMPLAINTS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Notes (optional)</label>
        <textarea name="notes" rows={2} className="input" placeholder="e.g. allergic reaction, needs insulin…" />
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-danger w-full justify-center py-3.5 text-base font-bold"
      >
        {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
        {pending ? "Sending SOS…" : "🚨 Send SOS"}
      </button>
    </form>
  );
}
