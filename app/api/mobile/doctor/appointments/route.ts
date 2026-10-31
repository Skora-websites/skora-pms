import { NextRequest } from "next/server";
import { getPracticeAppointments } from "@/lib/queries/doctor";
import { apiOk, anchorDoctorId, parsePage, requireDoctorModule, resolveDoctorScope } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/doctor/appointments — the practice's appointment list,
 * paginated with `?page=`.
 *
 * Mirrors `app/doctor/appointments/page.tsx`: same scope resolution
 * (`resolvePracticeDoctorId` + `listDoctorIdsFor`, so a clinic owner and
 * their receptionist see the practice and a member doctor sees only
 * themselves — never a peer's), same `?page=` clamping, and the same
 * `status` / `date` filter values the tab pills send. Conflict detection
 * reuses the existing byte route `GET /api/doctor/appointments/booked-times`.
 */
export async function GET(request: NextRequest) {
  const user = await requireDoctorModule("appointments");
  if (user instanceof Response) return user;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") ?? "all";
  const date = searchParams.get("date") ?? undefined;
  const page = parsePage(searchParams);

  const doctorIds = await resolveDoctorScope(user);
  const { rows, hasMore } = await getPracticeAppointments(
    doctorIds,
    { status, date },
    { page }
  );

  return apiOk({ rows, hasMore, page });
}
