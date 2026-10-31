import { NextRequest } from "next/server";
import { getTransactions } from "@/lib/queries/doctor";
import { apiOk, parsePage, requireDoctorModule, resolveDoctorScope } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/doctor/income-expense — the practice ledger, paginated
 * with `?page=` and filtered by `?period=month|last_month|all`.
 *
 * Wraps `getTransactions` (lib/queries/doctor.ts:427) with the same period
 * clamping `app/doctor/income-expense/page.tsx` applies (any value outside
 * `month` / `last_month` falls back to `all`) and the same
 * `listDoctorIdsFor`-derived ledger scope. A member doctor never sees a
 * peer's ledger rows.
 */
export async function GET(request: NextRequest) {
  const user = await requireDoctorModule("income-expense");
  if (user instanceof Response) return user;

  const { searchParams } = request.nextUrl;
  const rawPeriod = searchParams.get("period");
  const period =
    rawPeriod === "month" || rawPeriod === "last_month" ? rawPeriod : "all";
  const page = parsePage(searchParams);

  const doctorIds = await resolveDoctorScope(user);
  const ledger = await getTransactions(doctorIds, period, { page });

  return apiOk({ ...ledger, period, page });
}
