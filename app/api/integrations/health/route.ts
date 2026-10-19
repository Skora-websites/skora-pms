import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/guard";
import {
  HOLIDAY_STATE_DEFAULT,
  PUBLIC_API_ENABLED,
  PUBLIC_API_GEO_ENABLED,
  PUBLIC_API_HOLIDAY_ENABLED,
  PUBLIC_API_QR_ENABLED,
  PUBLIC_API_REFERENCE_ENABLED,
  PUBLIC_API_VALIDATION_ENABLED,
  PUBLIC_API_WEATHER_ENABLED,
} from "@/lib/config";

export const runtime = "nodejs";

/** GET /api/integrations/health — integration flags for dashboards (any authenticated user). */
export async function GET() {
  const user = await requireApiRole([
    "doctor",
    "receptionist",
    "patient",
    "admin",
    "super_admin",
  ]);
  if (user instanceof Response) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    enabled: PUBLIC_API_ENABLED,
    domains: {
      geo: PUBLIC_API_GEO_ENABLED,
      holidays: PUBLIC_API_HOLIDAY_ENABLED,
      weather: PUBLIC_API_WEATHER_ENABLED,
      validation: PUBLIC_API_VALIDATION_ENABLED,
      qr: PUBLIC_API_QR_ENABLED,
      reference: PUBLIC_API_REFERENCE_ENABLED,
    },
    defaults: { holidayState: HOLIDAY_STATE_DEFAULT },
    notice: "All endpoints are server-side; no API keys required.",
  });
}
