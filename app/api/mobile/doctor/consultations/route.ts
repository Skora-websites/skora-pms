import { NextRequest } from "next/server";
import { getConsultations } from "@/lib/queries/doctor";
import { apiOk, parsePage, requireDoctorActor, resolveDoctorScope } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/doctor/consultations — the consultation records list.
 *
 * Doctor-only area: `/doctor/consultations` is in `DOCTOR_ONLY_PATHS`
 * (lib/auth/permissions.ts:58), so a receptionist never reaches it whatever
 * module permissions they hold. That boundary is enforced here with the
 * existing `requireApiDoctorOnly` guard — it is a product boundary the
 * layout applies by bouncing the receptionist to `/receptionist`.
 *
 * Wraps `getConsultations` (lib/queries/doctor.ts:629) with the same scope
 * and `?page=` handling as `app/doctor/consultations/page.tsx:25`.
 */
export async function GET(request: NextRequest) {
  const user = await requireDoctorActor();
  if (user instanceof Response) return user;

  const page = parsePage(request.nextUrl.searchParams);
  const doctorIds = await resolveDoctorScope(user);
  const { rows, hasMore } = await getConsultations(doctorIds, { page });

  return apiOk({ rows, hasMore, page });
}
