import { getHomeVisits } from "@/lib/queries/doctor";
import { apiOk, requireAdminActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/admin/home-visits — every home-visit appointment in the
 * viewer's scope.
 *
 * Wraps `getHomeVisits` (lib/queries/doctor.ts:860) fed with
 * `getBusinessScope().doctorIds`, exactly as `app/admin/home-visits/page.tsx:23`
 * does. The patient-details drawer is not re-implemented here — the existing
 * route `GET /api/doctor/home-visits/patient-details/[id]` is reused.
 */
export async function GET() {
  const actor = await requireAdminActor("/admin/home-visits");
  if (actor instanceof Response) return actor;

  const visits = await getHomeVisits(actor.scope.doctorIds);
  return apiOk(visits);
}
