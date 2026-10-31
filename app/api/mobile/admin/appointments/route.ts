import { NextRequest } from "next/server";
import { getPracticeAppointments } from "@/lib/queries/doctor";
import { apiOk, parsePage, requireAdminActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/admin/appointments — every appointment in the viewer's
 * business scope, paginated with `?page=`.
 *
 * Wraps `getPracticeAppointments` (lib/queries/doctor.ts:134) with the same
 * `getBusinessScope().doctorIds` and the same `?page=` clamping as
 * `app/admin/appointments/page.tsx:38-41`. A manager sees only the clinics
 * they are assigned to — the scope is resolved server-side, never from a
 * caller-supplied clinic or doctor id.
 */
export async function GET(request: NextRequest) {
  const actor = await requireAdminActor("/admin/appointments");
  if (actor instanceof Response) return actor;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") ?? "all";
  const date = searchParams.get("date") ?? undefined;
  const page = parsePage(searchParams);

  const { rows, hasMore } = await getPracticeAppointments(
    actor.scope.doctorIds,
    { status, date },
    { page }
  );

  return apiOk({ rows, hasMore, page });
}
