import { getHomeVisits } from "@/lib/queries/doctor";
import { apiOk, requireDoctorModule, resolveDoctorScope } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/doctor/home-visits — the practice's home-visit
 * appointments.
 *
 * Wraps `getHomeVisits` (lib/queries/doctor.ts:860) with the same scope as
 * `app/doctor/home-visits/page.tsx:24`. The patient-details drawer is not
 * re-implemented here — the existing route
 * `GET /api/doctor/home-visits/patient-details/[id]` is reused.
 */
export async function GET() {
  const user = await requireDoctorModule("home-visit");
  if (user instanceof Response) return user;

  const doctorIds = await resolveDoctorScope(user);
  const visits = await getHomeVisits(doctorIds);
  return apiOk(visits);
}
