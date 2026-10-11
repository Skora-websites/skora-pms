import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/guard";
import { weatherQuerySchema } from "@/lib/validation/integrations";
import { getWeatherAdvisory } from "@/lib/integrations/public-apis";

export const runtime = "nodejs";

/** GET /api/integrations/weather?lat=28.6&lon=77.2&date=2026-01-26 — Open-Meteo advisory (cached 6h). */
export async function GET(request: NextRequest) {
  const user = await requireApiRole(["doctor", "receptionist", "admin", "manager"]);
  if (user instanceof Response) return user;
  const params = request.nextUrl.searchParams;
  const parsed = weatherQuerySchema.safeParse({
    lat: params.get("lat") ?? "",
    lon: params.get("lon") ?? "",
    date: params.get("date") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid query" }, { status: 400 });
  }
  try {
    const { data, cached } = await getWeatherAdvisory(parsed.data.lat, parsed.data.lon, parsed.data.date);
    return NextResponse.json({ ...data, cached, attribution: "open-meteo.com" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Weather lookup failed";
    const status = /disabled/i.test(message) ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
