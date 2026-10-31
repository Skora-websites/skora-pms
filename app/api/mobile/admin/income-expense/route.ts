import { NextRequest } from "next/server";
import { getTransactions } from "@/lib/queries/doctor";
import { apiOk, parsePage, requireAdminActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/admin/income-expense — the ledger across the viewer's
 * scope, paginated with `?page=` and filtered by `?period=month|last_month|all`.
 *
 * Wraps `getTransactions` (lib/queries/doctor.ts:427) with the same period
 * clamping `app/admin/income-expense/page.tsx` applies and the same scope.
 * A manager's ledger contains only their assigned clinics' doctors.
 */
export async function GET(request: NextRequest) {
  const actor = await requireAdminActor("/admin/income-expense");
  if (actor instanceof Response) return actor;

  const { searchParams } = request.nextUrl;
  const rawPeriod = searchParams.get("period");
  const period =
    rawPeriod === "month" || rawPeriod === "last_month" ? rawPeriod : "all";
  const page = parsePage(searchParams);

  const doctorIds = actor.scope.doctorIds;
  const ledger = await getTransactions(doctorIds, period, { page, pageSize: 50 });

  return apiOk({ ...ledger, period, page });
}
