import { NextRequest } from "next/server";
import { getConsultations } from "@/lib/queries/doctor";
import { apiOk, parsePage, requireAdminActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/admin/consultations — every consultation record in the
 * viewer's scope, paginated with `?page=`.
 *
 * Wraps `getConsultations` (lib/queries/doctor.ts:629) with
 * `getBusinessScope().doctorIds` and the same `?page=` clamping as
 * `app/admin/consultations/page.tsx:30`.
 *
 * Note this is the ADMIN surface's read of consultation records, which
 * `/admin/consultations` grants through the `consultations` module of
 * `ADMIN_ROUTE_PERMISSIONS` — it is distinct from the doctor-only
 * `/api/mobile/doctor/consultations`, which `requireApiDoctorOnly` guards.
 */
export async function GET(request: NextRequest) {
  const actor = await requireAdminActor("/admin/consultations");
  if (actor instanceof Response) return actor;

  const page = parsePage(request.nextUrl.searchParams);
  const { rows, hasMore } = await getConsultations(actor.scope.doctorIds, {
    page,
  });

  return apiOk({ rows, hasMore, page });
}
