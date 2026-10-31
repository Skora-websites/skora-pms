import { getClinicsWithSchedules } from "@/lib/queries/doctor";
import { apiOk, anchorDoctorId, requireDoctorModule } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/doctor/schedule — the doctor's clinics and their weekly
 * slots.
 *
 * Wraps `getClinicsWithSchedules` (lib/queries/doctor.ts:295), the helper
 * `app/doctor/schedule/page.tsx:22` reads. The doctor id is the
 * practice-anchor id resolved from the session — never a request parameter.
 * Module permission: the page's `schedule` perm.
 */
export async function GET() {
  const user = await requireDoctorModule("schedule");
  if (user instanceof Response) return user;

  const clinics = await getClinicsWithSchedules(anchorDoctorId(user));
  return apiOk(clinics);
}
