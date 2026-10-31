import { getDormantAccounts } from "@/lib/queries/analytics";
import {
  getDoctorGrowth,
  getDoctors,
  getPatientGrowth,
  getRecentTickets,
  getSuperAdminStats,
  getTopClinics,
} from "@/lib/queries/super-admin";
import { apiOk, requireSuperAdminActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/super/stats — the platform stats page payload, including
 * the growth series.
 *
 * Wraps the seven calls `app/super-admin/page.tsx:31-39` makes in its single
 * `Promise.all`, with their defaults left exactly as the page passes them
 * (`getDoctorGrowth(6)`, `getPatientGrowth(6)`, `getTopClinics(5)`,
 * `getRecentTickets(5)`, `getDormantAccounts(90)`).
 *
 * Guard: `requireRole(["super_admin"])` on the page, so the equivalent
 * `requireApiRole(["super_admin"])` here — strict, with no tier flexibility
 * and no module permission layer (the super-admin shell has none).
 */
export async function GET() {
  const user = await requireSuperAdminActor();
  if (user instanceof Response) return user;

  const [stats, doctors, doctorGrowth, patientGrowth, topClinics, recentTickets, dormantAccounts] =
    await Promise.all([
      getSuperAdminStats(),
      getDoctors(),
      getDoctorGrowth(6),
      getPatientGrowth(6),
      getTopClinics(5),
      getRecentTickets(5),
      getDormantAccounts(90),
    ]);

  return apiOk({
    stats,
    doctors,
    doctorGrowth,
    patientGrowth,
    topClinics,
    recentTickets,
    dormantAccounts,
  });
}
