import { getPatientTestBookings } from "@/lib/queries/patient";
import { apiOk, requirePatientActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/patient/test-reports — the patient's lab bookings and
 * their uploaded reports.
 *
 * Wraps `getPatientTestBookings` (lib/queries/patient.ts:71), the helper
 * `app/patient/test-reports/page.tsx:15` reads. Files and the AI summary are
 * NOT re-served here: the client uses the existing byte route
 * `GET /api/patient/test-reports/[id]` and
 * `POST /api/patient/test-reports/[id]/summarize` per row's `id`.
 */
export async function GET() {
  const user = await requirePatientActor();
  if (user instanceof Response) return user;

  const bookings = await getPatientTestBookings(user.id);
  return apiOk(bookings);
}
