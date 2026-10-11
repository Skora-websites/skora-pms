import "server-only";
import { PUBLIC_API_WEATHER_ENABLED } from "@/lib/config";
import { assertPublicApiEnabled, fetchPublicJson } from "./client";
import { cached, cacheKey } from "./cache";

export type WeatherAdvisory = {
  date: string;
  precipitationProbabilityMax: number;
  weatherCodeMax: number;
  advisory: string | null;
  source: "open-meteo";
};

type OpenMeteoResponse = {
  hourly?: {
    time?: string[];
    precipitation_probability?: Array<number | null>;
    weathercode?: Array<number | null>;
  };
};

function advisoryFor(maxProb: number, maxCode: number): string | null {
  if (maxProb >= 70) return "Heavy rain likely — carry kit / offer reschedule";
  if (maxProb >= 50) return "Rain likely — plan buffer time for home visits";
  if (maxCode >= 95) return "Thunderstorm possible — avoid long routes";
  if (maxCode >= 71) return "Snow/ice possible — confirm visit by phone";
  return null;
}

/** Day advisory for home-visit routing. Cached 6h per rounded lat/lon+date. */
export async function getWeatherAdvisory(
  lat: number,
  lon: number,
  date: string
): Promise<{ data: WeatherAdvisory; cached: boolean }> {
  assertPublicApiEnabled(PUBLIC_API_WEATHER_ENABLED);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error("Invalid coordinates");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Date must be YYYY-MM-DD");
  const key = cacheKey(["wx", lat.toFixed(2), lon.toFixed(2), date]);
  return cached<WeatherAdvisory>(key, 6 * 3600, async () => {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&hourly=precipitation_probability,weathercode&start_date=${date}&end_date=${date}&timezone=Asia%2FKolkata`;
    const raw = await fetchPublicJson<OpenMeteoResponse>("open-meteo", url);
    const probs: number[] = (raw.hourly?.precipitation_probability ?? []).filter(
      (v): v is number => typeof v === "number"
    );
    const codes: number[] = (raw.hourly?.weathercode ?? []).filter(
      (v): v is number => typeof v === "number"
    );
    const maxProb = probs.length > 0 ? Math.max(...probs) : 0;
    const maxCode = codes.length > 0 ? Math.max(...codes) : 0;
    return {
      date,
      precipitationProbabilityMax: maxProb,
      weatherCodeMax: maxCode,
      advisory: advisoryFor(maxProb, maxCode),
      source: "open-meteo" as const,
    };
  });
}
