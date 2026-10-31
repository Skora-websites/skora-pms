import { NextRequest } from "next/server";
import { getPracticeOnlineConsultations } from "@/lib/queries/doctor";
import { apiOk, parsePage, requireAdminActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/admin/online-consultations — every online visit in the
 * viewer's scope.
 *
 * Wraps `getPracticeOnlineConsultations` (lib/queries/doctor.ts:174) fed with
 * `getBusinessScope().doctorIds` and the same `status` filter as
 * `app/admin/online-consultations/page.tsx:27`.
 *
 * This is the admin surface's read of online visits, which
 * `/admin/online-consultations` grants through the `online-consultations`
 * module of ADMIN_ROUTE_PERMISSIONS. It is distinct from the doctor-only
 * `/api/mobile/doctor/online-consultations`, which `requireApiDoctorOnly`
 * guards — emergency stays doctor-only on both surfaces.
 */
export async function GET(request: NextRequest) {
  const actor = await requireAdminActor("/admin/online-consultations");
  if (actor instanceof Response) return actor;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") ?? undefined;
  const page = parsePage(searchParams);

  const { rows, hasMore } = await getPracticeOnlineConsultations(
    actor.scope.doctorIds,
    { status },
    { page }
  );

  return apiOk({ rows, hasMore, page });
}
