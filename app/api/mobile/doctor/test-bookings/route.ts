import { NextRequest } from "next/server";
import { getTestBookings, getTests, getVendors } from "@/lib/queries/doctor";
import { apiOk, parsePage, requireDoctorModule, resolveDoctorScope } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/doctor/test-bookings — lab bookings across the practice,
 * paginated with `?page=`, plus the vendor and test catalogs the booking
 * form chooses from.
 *
 * Wraps the three helpers `app/doctor/test-bookings/page.tsx:33` reads in its
 * single `Promise.all`, all scoped through `listDoctorIdsFor`. Patient
 * details and booking suggestions are not re-implemented here — the existing
 * routes `GET /api/doctor/test-bookings/patient-details` and
 * `…/suggestions` are reused, and the report PDF via
 * `GET /api/doctor/test-bookings/[id]/report`.
 */
export async function GET(request: NextRequest) {
  const user = await requireDoctorModule("test-booking");
  if (user instanceof Response) return user;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const page = parsePage(searchParams);

  const doctorIds = await resolveDoctorScope(user);
  const [{ rows: bookings, hasMore }, vendors, tests] = await Promise.all([
    getTestBookings(doctorIds, { status, q }, { page }),
    getVendors(doctorIds),
    getTests(doctorIds),
  ]);

  return apiOk({ rows: bookings, hasMore, page, vendors, tests });
}
