import { NextRequest, NextResponse } from "next/server";
import { requireApiDoctorOnly } from "@/lib/auth/guard";
import { medicineQuerySchema, medicineRxcuiSchema } from "@/lib/validation/integrations";
import {
  getDrugLabel,
  getDrugRecalls,
  getMedicineDetail,
  searchMedicines,
} from "@/lib/integrations/public-apis";
import { PublicApiDisabledError } from "@/lib/integrations/public-apis/client";

export const runtime = "nodejs";

const NOTICE = "Reference only — US NLM/FDA data, verify before prescribing. Never blocks consultation save.";

/**
 * GET /api/integrations/medicines?q=…[&mode=search|label|recall]
 * GET /api/integrations/medicines?mode=detail&rxcui=…
 * Doctor-only. Read-only, advisory, never blocks prescribing.
 */
export async function GET(request: NextRequest) {
  const user = await requireApiDoctorOnly();
  if (user instanceof Response) return user;
  const params = request.nextUrl.searchParams;
  const mode = params.get("mode") ?? "search";

  try {
    if (mode === "detail") {
      const parsed = medicineRxcuiSchema.safeParse({ rxcui: params.get("rxcui") ?? "" });
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid RxCUI" }, { status: 400 });
      }
      const { data, cached } = await getMedicineDetail(parsed.data.rxcui);
      return NextResponse.json({ detail: data, cached, notice: NOTICE });
    }

    const parsed = medicineQuerySchema.safeParse({ q: params.get("q") ?? "" });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid query" }, { status: 400 });
    }
    if (mode === "label") {
      const { data, cached } = await getDrugLabel(parsed.data.q);
      return NextResponse.json({ label: data, cached, notice: NOTICE });
    }
    if (mode === "recall") {
      const { data, cached } = await getDrugRecalls(parsed.data.q);
      return NextResponse.json({ recalls: data, cached, notice: NOTICE });
    }
    if (mode !== "search") {
      return NextResponse.json({ error: "Unknown mode" }, { status: 400 });
    }
    const { data, cached } = await searchMedicines(parsed.data.q);
    return NextResponse.json({ medicines: data, cached, notice: NOTICE });
  } catch (err) {
    if (err instanceof PublicApiDisabledError) {
      return NextResponse.json({ error: "Medicine lookup disabled" }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : "Medicine lookup failed";
    const status = /patient data/i.test(message) ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
