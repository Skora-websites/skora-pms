import { NextRequest } from "next/server";
import { getDoctorPatients } from "@/lib/queries/doctor";
import { apiOk, anchorDoctorId, requireDoctorModule } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/doctor/patients — the practice's patient roster, searchable
 * with `?q=` and optionally bounded by `?start_date=` / `?end_date=`.
 *
 * Wraps `getDoctorPatients` (lib/queries/doctor.ts:213), exactly as
 * `app/doctor/patients/page.tsx:20` calls it. The search/date parameters are
 * the page's own filter fields, never a scoping input: the doctor id is the
 * practice-anchor id from the session. Module permission: the page's
 * `registrations` perm.
 */
export async function GET(request: NextRequest) {
  const user = await requireDoctorModule("registrations");
  if (user instanceof Response) return user;

  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? undefined;
  const startDate = searchParams.get("start_date") ?? undefined;
  const endDate = searchParams.get("end_date") ?? undefined;

  const patients = await getDoctorPatients(
    anchorDoctorId(user),
    q,
    startDate,
    endDate
  );
  return apiOk(patients);
}
