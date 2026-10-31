import { getAvailableDoctors } from "@/lib/queries/patient";
import { apiOk, requirePatientActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/patient/doctors — the booking-flow directory.
 *
 * Wraps `getAvailableDoctors` (lib/queries/patient.ts:108), the helper
 * `app/patient/find-doctor/page.tsx:13` and the booking page read. It takes
 * no patient argument — the directory is role-filtered to doctors with an
 * active clinic and schedule. Deliberately NOT `/api/shule/doctors`, which
 * is bearer-token-only and staff-tier gated so a patient can never call it.
 */
export async function GET() {
  const user = await requirePatientActor();
  if (user instanceof Response) return user;

  const doctors = await getAvailableDoctors();
  return apiOk(doctors);
}
