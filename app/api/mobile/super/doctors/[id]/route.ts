import { NextRequest } from "next/server";
import { getDoctorDetails } from "@/lib/queries/super-admin";
import { apiError, apiOk, requireSuperAdminActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/super/doctors/[id] — one doctor's platform record.
 *
 * Wraps `getDoctorDetails` (lib/queries/super-admin.ts:195), the helper
 * `app/super-admin/doctors/[id]/page.tsx:22` calls. It returns `null` when
 * the id is not a doctor, which the page renders as `notFound()` — the same
 * 404 a route returns here, so a non-doctor id is indistinguishable from a
 * miss. Guard: `requireApiRole(["super_admin"])`.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireSuperAdminActor();
  if (user instanceof Response) return user;

  const { id } = await params;
  const doctorId = Number(id);
  if (!Number.isInteger(doctorId)) {
    return apiError("Invalid doctor", 400);
  }

  const doctor = await getDoctorDetails(doctorId);
  if (!doctor) return apiError("Doctor not found", 404);

  return apiOk(doctor);
}
