import { NextRequest, NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/guard";
import { geocodeQuerySchema } from "@/lib/validation/integrations";
import { geocodeAddress } from "@/lib/integrations/public-apis";

export const runtime = "nodejs";

/** GET /api/integrations/geocode?address=… — Nominatim forward-geocode (server-side, cached 30d). */
export async function GET(request: NextRequest) {
  const user = await requireApiRole(["doctor", "receptionist", "admin", "manager", "patient"]);
  if (user instanceof Response) return user;
  const parsed = geocodeQuerySchema.safeParse({
    address: request.nextUrl.searchParams.get("address") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid address" }, { status: 400 });
  }
  try {
    const { data, cached } = await geocodeAddress(parsed.data.address);
    return NextResponse.json({ results: data, cached, attribution: "© OpenStreetMap contributors" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Geocoding failed";
    const status = /disabled/i.test(message) ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
