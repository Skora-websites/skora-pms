import "server-only";
import { HOLIDAY_STATE_DEFAULT, PUBLIC_API_HOLIDAY_ENABLED } from "@/lib/config";
import { assertPublicApiEnabled, fetchPublicJson } from "./client";
import { cached, cacheKey } from "./cache";

export type Holiday = {
  date: string;
  name: string;
  states: string[];
  source: "india-holidays" | "nager" | "caldays";
};

/** Normalize a state code for lookup. Defaults to Delhi. */
export function normalizeState(input: string | null | undefined): string {
  const s = (input ?? "").trim().toUpperCase().slice(0, 3);
  if (/^[A-Z]{2,3}$/.test(s)) return s;
  return HOLIDAY_STATE_DEFAULT;
}

type IndiaHolidayRow = {
  name?: string;
  date?: string;
  type?: string;
};

type IndiaHolidayEnvelope = {
  data?: IndiaHolidayRow[];
};

async function fetchIndiaPrimary(year: number, region: string): Promise<Holiday[]> {
  // India Calendar API (calendar-api-d7a8.onrender.com): official Central +
  // state holidays. Region = uppercase 2-letter code; state-specific entries
  // are combined with central ones server-side.
  const url =
    `https://calendar-api-d7a8.onrender.com/v1/holidays?country=IN&year=${year}&region=${region}`;
  const raw = await fetchPublicJson<IndiaHolidayEnvelope>("india-holidays", url);
  return (raw.data ?? [])
    .map((r) => ({
      date: String(r.date ?? "").slice(0, 10),
      name: String(r.name ?? "Public holiday"),
      states: [region],
      source: "india-holidays" as const,
    }))
    .filter((h) => /^\d{4}-\d{2}-\d{2}$/.test(h.date));
}

type NagerRow = { date?: string; name?: string };

async function fetchNagerFallback(year: number): Promise<Holiday[]> {
  const rows = await fetchPublicJson<NagerRow[]>("nager", `https://date.nager.at/api/v3/PublicHolidays/${year}/IN`);
  return rows
    .filter((r) => typeof r.date === "string")
    .map((r) => ({
      date: String(r.date).slice(0, 10),
      name: String(r.name ?? "Public holiday"),
      states: [] as string[],
      source: "nager" as const,
    }));
}

/** Holidays for a state+year, primary with Nager fallback. Cached 24h. */
export async function getHolidays(state: string, year: number): Promise<{ data: Holiday[]; cached: boolean; source: string }> {
  assertPublicApiEnabled(PUBLIC_API_HOLIDAY_ENABLED);
  const st = normalizeState(state);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new Error("Invalid year");
  const key = cacheKey(["holidays", st, String(year)]);
  const hit = await cached<{ data: Holiday[]; source: string }>(key, 24 * 3600, async () => {
    try {
      const data = await fetchIndiaPrimary(year, st);
      return { data, source: "india-holidays" };
    } catch {
      const data = await fetchNagerFallback(year);
      return { data, source: "nager" };
    }
  });
  return { data: hit.data.data, cached: hit.cached, source: hit.data.source };
}

/** True when the date is a holiday for the state (empty states[] = national). */
export function isHolidayOn(holidays: Holiday[], date: string, state: string): Holiday | null {
  const st = normalizeState(state);
  for (const h of holidays) {
    if (h.date !== date) continue;
    if (h.states.length === 0) return h;
    if (h.states.map((s) => s.toUpperCase()).includes(st)) return h;
  }
  return null;
}
