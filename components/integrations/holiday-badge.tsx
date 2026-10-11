"use client";

import { useEffect, useState } from "react";

type Props = { date: string; state?: string };

/** Advisory badge under booking date inputs. Never blocks — emergency visits stay allowed. */
export function HolidayBadge({ date, state = "DL" }: Props) {
  const [label, setLabel] = useState<string | null>(null);
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(date);

  useEffect(() => {
    if (!valid) return;
    const year = date.slice(0, 4);
    let cancelled = false;
    fetch(`/api/integrations/holidays?state=${encodeURIComponent(state)}&year=${year}&date=${date}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j) return;
        if (j.isHoliday) setLabel(`Holiday: ${j.holiday?.name ?? "public holiday"} — emergency-only slots.`);
        else setLabel(null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [date, state, valid]);

  if (!valid || !label) return null;
  return (
    <p className="mt-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800">{label}</p>
  );
}
