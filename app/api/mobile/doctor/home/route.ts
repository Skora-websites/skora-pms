import { getDashboardStats } from "@/lib/queries/analytics";
import {
  getRecentAppointments,
  getTodaysAppointments,
  isPracticeWideUser,
} from "@/lib/queries/doctor";
import { apiOk, anchorDoctorId, requireDoctorModule, resolveDoctorScope } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/doctor/home — greeting + today's schedule + recent.
 *
 * Mirrors `app/doctor/page.tsx` branch-for-branch: a receptionist (practice
 * staff) gets the whole practice's queue, a member doctor gets strictly
 * their own rows (privacy rule D4). The module permission is the page's
 * `dashboard` perm from DOCTOR_ROUTE_PERMISSIONS.
 *
 * Wrapped helpers, all as the page calls them:
 *  - getTodaysAppointments / getPracticeTodaysAppointments (doctor.ts:115/:124)
 *  - getRecentAppointments / getPracticeRecentAppointments (doctor.ts:154/:165)
 *  - getDashboardStats (analytics.ts:425)
 */
export async function GET() {
  const user = await requireDoctorModule("dashboard");
  if (user instanceof Response) return user;

  const doctorId = anchorDoctorId(user);
  const isPracticeWide = isPracticeWideUser(user.role);
  const scope = isPracticeWide ? await resolveDoctorScope(user) : [user.id];

  const [todays, recent, stats] = await Promise.all([
    getTodaysAppointments(scope),
    getRecentAppointments(scope, 6),
    getDashboardStats(scope),
  ]);

  return apiOk({
    greetingName: user.name,
    isPracticeWide,
    todaysAppointments: todays,
    recentAppointments: recent,
    stats,
  });
}
