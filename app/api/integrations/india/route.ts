import { NextRequest, NextResponse } from "next/server";
import { requireApiDoctorOnly } from "@/lib/auth/guard";
import { indiaQuerySchema } from "@/lib/validation/integrations";
import { searchIndia, datasetVersion, datasetSources } from "@/lib/integrations/india";

export const runtime = "nodejs";

const NOTICE =
  "Reference only — Indian clinical data (verify against the product insert before prescribing). Advisory; never blocks consultation save.";

/**
 * GET /api/integrations/india?kind=medicines|symptoms|examinations|diagnoses|lab-tests|history|instructions&q=…
 *
 * Doctor-only (consultation form is doctor-facing). Suggested terms for the
 * seven clinical fields — dataset provider by default, live India provider
 * when INDIA_API_BASE_URL is configured. Always exits 200 with an empty
 * list on lookup failure: the picker degrades and free text still works.
 */
export async function GET(request: NextRequest) {
  const user = await requireApiDoctorOnly();
  if (user instanceof Response) return user;

  const params = request.nextUrl.searchParams;
  const parsed = indiaQuerySchema.safeParse({ kind: params.get("kind") ?? undefined, q: params.get("q") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid query" }, { status: 400 });
  }

  // searchIndia is total: the kill switch and any live-upstream failure both
  // resolve to an empty item list, so the picker degrades and free text works.
  const result = await searchIndia(parsed.data.kind, parsed.data.q);
  return NextResponse.json({
    items: result.data,
    cached: result.cached,
    provider: result.provider,
    datasetVersion: datasetVersion(),
    datasetSources: datasetSources(),
    notice: NOTICE,
  });
}