/** Shared "h:mm AM/PM" (legacy) → "HH:MM" (24h) conversion for time inputs. */
export function to24hTime(time: string | null): string {
  if (!time) return "";
  const m = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return "";
  let h = Number(m[1]);
  const min = m[2];
  const meridiem = m[3]?.toUpperCase();
  if (meridiem === "PM" && h !== 12) h += 12;
  if (meridiem === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${min}`;
}
