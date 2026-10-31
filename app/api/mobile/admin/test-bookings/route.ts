import { NextRequest } from "next/server";
import { getTestBookings, getTests, getVendors } from "@/lib/queries/doctor";
import { apiOk, parsePage, requireAdminActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/admin/test-bookings — every lab booking in the viewer's
 * scope, paginated with `?page=`, plus the vendor and test catalogs.
 *
 * Wraps the three calls `app/admin/test-bookings/page.tsx:23-27` makes. The
 * page pins page 1 at pageSize 50; this route keeps the same catalog default
 * but honours `?page=` so the app can page through a long list, which is the
 * contract's pagination convention for new routes.
 */
export async function GET(request: NextRequest) {
  const actor = await requireAdminActor("/admin/test-bookings");
  if (actor instanceof Response) return actor;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const page = parsePage(searchParams);

  const doctorIds = actor.scope.doctorIds;
  const [{ rows: bookings, hasMore }, vendors, tests] = await Promise.all([
    getTestBookings(doctorIds, { status, q }, { page, pageSize: 50 }),
    getVendors(doctorIds),
    getTests(doctorIds),
  ]);

  return apiOk({ rows: bookings, hasMore, page, vendors, tests });
}
