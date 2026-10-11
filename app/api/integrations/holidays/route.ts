import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/guard";
import { holidaysQuerySchema } from "@/lib/validation/integrations";
import { getHolidays, isHolidayOn, normalizeState } from "@/lib/integrations/public-apis";
import { todayStr } from "@/lib/utils";

export const runtime = "nodejs";

/**
 * GET /api/integrations/holidays?state=DL&year=2026[&date=2026-01-26]
 * India gazetted holidays (primary) with Nager fallback, cached 24h.
 * With ?date=, also returns whether that date is a holiday for the state.
 */
export async function GET(request: NextRequest) {
  const user = await requireApiRole(["doctor", "receptionist", "admin", "manager", "patient"]);
  if (user instanceof Response) return user;
  const params = request.nextUrl.searchParams;
  const parsed = holidaysQuerySchema.safeParse({
    state: params.get("state") ?? "DL",
    year: params.get("year") ?? String(new Date().getFullYear()),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid query" }, { status: 400 });
  }
  const date = params.get("date") ?? "";
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  try {
    const state = normalizeState(parsed.data.state);
    const year = parsed.data.year ?? Number(todayStr().slice(0, 4));
    const { data, cached, source } = await getHolidays(state, year);
    const checkDate = date || undefined;
    const holiday = checkDate ? isHolidayOn(data, checkDate, state) : null;
    return NextResponse.json({ state, year, holidays: data, cached, source, isHoliday: holiday !== null, holiday });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Holiday lookup failed";
    const status = /disabled/i.test(message) ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
