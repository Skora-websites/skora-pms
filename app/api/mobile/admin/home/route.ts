import { todayStr } from "@/lib/utils";
import { getArAging, getCohorts, getDoctorPerformance, getRates } from "@/lib/queries/analytics";
import {
  getFirstBusinessName,
  getOwnerDashboard,
  listScopedClinicSummaries,
} from "@/lib/queries/admin";
import { getPracticeFinanceTrend, getPracticeStats, getPracticeRecentAppointments, getPracticeTodaysAppointments } from "@/lib/queries/doctor";
import { apiError, apiOk, requireAdminActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/admin/home — one route, two shapes by viewer tier
 * (FR-039/FR-040).
 *
 * Owner: the cross-clinic KPI strip `app/admin/page.tsx` renders — practice
 * stats, today's appointments, recent feed, monthly revenue, revenue by
 * clinic, plus the analytics layers only an owner sees.
 * Manager: the same "Clinic OS" widgets, already scoped to the assigned
 * clinics by `getBusinessScope()`.
 *
 * Scope comes from `getBusinessScope()` (resolved server-side in the shared
 * helper) — never a clinic, business or doctor id from the request. A manager
 * with no assigned clinic gets an empty scope and the "no access yet" state.
 */
export async function GET() {
  const actor = await requireAdminActor("/admin");
  if (actor instanceof Response) return actor;
  const { scope, viewerRole } = actor;

  if (viewerRole === "manager") {
    // A manager with no clinics has no data at all — the app shows "no access
    // yet", not an empty dashboard.
    if (scope.businessIds.length === 0 || scope.doctorIds.length === 0) {
      return apiError("No clinic is assigned to your account", 403);
    }

    const [
      stats,
      todays,
      recent,
      financeTrend,
      rates,
    ] = await Promise.all([
      getPracticeStats(scope.doctorIds),
      getPracticeTodaysAppointments(scope.doctorIds),
      getPracticeRecentAppointments(scope.doctorIds, 6),
      getPracticeFinanceTrend(scope.doctorIds, 6),
      getRates({ doctorIds: scope.doctorIds, clinicIds: scope.clinicIds }),
    ]);

    return apiOk({
      viewerRole,
      businessName:
        (await getFirstBusinessName(scope.businessIds)) ?? "Clinic",
      clinicCount: scope.clinicIds.length,
      stats,
      todaysAppointments: todays,
      recentAppointments: recent,
      financeTrend,
      rates,
    });
  }

  const monthStart = todayStr(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [owner, clinics, rates, aging, cohorts, performance] = await Promise.all([
    getOwnerDashboard({
      doctorIds: scope.doctorIds,
      clinicIds: scope.clinicIds,
      today: todayStr(),
      monthStart,
    }),
    listScopedClinicSummaries(scope.clinicIds),
    getRates({ doctorIds: scope.doctorIds, clinicIds: scope.clinicIds }),
    getArAging(scope.doctorIds),
    getCohorts({ doctorIds: scope.doctorIds, clinicIds: scope.clinicIds }),
    getDoctorPerformance({ doctorIds: scope.doctorIds, clinicIds: scope.clinicIds }),
  ]);

  return apiOk({
    viewerRole,
    overview: owner,
    clinics,
    rates,
    arAging: aging,
    cohorts,
    doctorPerformance: performance,
  });
}
