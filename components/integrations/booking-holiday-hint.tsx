"use client";

import { useEffect, useState } from "react";
import { HolidayBadge } from "./holiday-badge";

/**
 * Zero-refactor holiday hint for booking forms: observes the existing
 * date input (id="date") and shows an advisory badge. Emergency bookings
 * stay allowed — this never blocks submission.
 */
export function BookingHolidayHint({ dateInputId = "date", state = "DL" }: { dateInputId?: string; state?: string }) {
  const [date, setDate] = useState("");

  useEffect(() => {
    const el = document.getElementById(dateInputId) as HTMLInputElement | null;
    if (!el) return;
    // Mount-time read of an uncontrolled input owned by the parent form —
    // this is external-system sync, the intended use of effects here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDate(el.value);
    const onChange = () => setDate(el.value);
    el.addEventListener("change", onChange);
    el.addEventListener("input", onChange);
    return () => {
      el.removeEventListener("change", onChange);
      el.removeEventListener("input", onChange);
    };
  }, [dateInputId]);

  if (!date) return null;
  return <HolidayBadge date={date} state={state} />;
}
