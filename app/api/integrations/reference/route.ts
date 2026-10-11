import { NextRequest, NextResponse } from "next/server";
import { requireApiDoctorOnly, requireApiRole } from "@/lib/auth/guard";
import { foodQuerySchema, referenceQuerySchema } from "@/lib/validation/integrations";
import { lookupFood, searchReference } from "@/lib/integrations/public-apis";

export const runtime = "nodejs";

/**
 * GET /api/integrations/reference?q=… — doctor-only literature search.
 * Read-only, non-diagnostic. PHI-like queries are rejected (400).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  if (params.get("mode") === "food") {
    const user = await requireApiRole(["doctor", "receptionist", "admin", "manager"]);
    if (user instanceof Response) return user;
    const parsed = foodQuerySchema.safeParse({ name: params.get("name") ?? "" });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid food" }, { status: 400 });
    }
    try {
      const { data, cached } = await lookupFood(parsed.data.name);
      return NextResponse.json({ foods: data, cached, attribution: "openfoodfacts.org" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Food lookup failed";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }
  const user = await requireApiDoctorOnly();
  if (user instanceof Response) return user;
  const parsed = referenceQuerySchema.safeParse({ q: params.get("q") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid query" }, { status: 400 });
  }
  try {
    const { data, cached } = await searchReference(parsed.data.q);
    return NextResponse.json({
      results: data,
      cached,
      notice: "Reference only — not a diagnosis. Verify before clinical use.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Reference search failed";
    const status = /patient data/i.test(message) ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
