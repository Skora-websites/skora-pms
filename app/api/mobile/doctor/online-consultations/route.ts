import { NextRequest } from "next/server";
import { getPracticeOnlineConsultations } from "@/lib/queries/doctor";
import { apiOk, requireDoctorActor, resolveDoctorScope } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/doctor/online-consultations — the practice's online visits.
 *
 * Doctor-only area: `/doctor/online-consultations` is in `DOCTOR_ONLY_PATHS`
 * (lib/auth/permissions.ts:58), so a receptionist is refused server-side
 * through the existing `requireApiDoctorOnly` guard rather than merely hidden
 * in the app (FR-038).
 *
 * Wraps `getPracticeOnlineConsultations` (lib/queries/doctor.ts:174) with the
 * same `status` filter and `?page=` handling as
 * `app/doctor/online-consultations/page.tsx:30`.
 */
export async function GET(request: NextRequest) {
  const user = await requireDoctorActor();
  if (user instanceof Response) return user;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") ?? undefined;
  const pageRaw = searchParams.get("page");
  const page = Math.max(1, Number.parseInt(pageRaw ?? "1", 10) || 1);

  const doctorIds = await resolveDoctorScope(user);
  const { rows, hasMore } = await getPracticeOnlineConsultations(
    doctorIds,
    { status },
    { page }
  );

  return apiOk({ rows, hasMore, page });
}
