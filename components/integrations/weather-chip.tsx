"use client";

import { useEffect, useState } from "react";

type Props = { lat: number; lon: number; date: string };

/** Advisory chip on home-visit detail. Hidden when the upstream is down. */
export function WeatherChip({ lat, lon, date }: Props) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    let cancelled = false;
    fetch(`/api/integrations/weather?lat=${lat}&lon=${lon}&date=${date}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j?.advisory) return;
        setText(`${j.advisory} (rain ${j.precipitationProbabilityMax ?? 0}%)`);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [lat, lon, date]);

  if (!text) return null;
  return (
    <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs text-sky-900" title="Source: open-meteo.com">
      {text}
    </p>
  );
}
