import {
  getPatientConsultations,
  getPatientStats,
  getUpcomingPatientAppointments,
} from "@/lib/queries/patient";
import { apiOk, requirePatientActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/patient/home — the patient dashboard payload.
 *
 * Wraps the exact helpers `app/patient/page.tsx` reads (one `Promise.all`),
 * so the app renders the same KPI cards, upcoming list and recent
 * consultations the web dashboard does. Scoping is the caller's own
 * `patientId` (from the session, never the request).
 */
export async function GET() {
  const user = await requirePatientActor();
  if (user instanceof Response) return user;

  const [stats, upcomingAppointments, consultations] = await Promise.all([
    getPatientStats(user.id),
    getUpcomingPatientAppointments(user.id),
    getPatientConsultations(user.id),
  ]);

  return apiOk({
    stats,
    upcomingAppointments,
    consultations,
  });
}
