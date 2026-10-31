import {
  listClinicDoctorOptions,
  listScopedClinics,
  listScopedSchedules,
  scopeOrSentinel,
} from "@/lib/queries/admin";
import { apiOk, requireAdminActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/admin/schedule — the clinics, their weekly schedules and
 * the doctor options the schedule form assigns.
 *
 * Wraps the three calls `app/admin/schedule/page.tsx:20-24` makes in its
 * single `Promise.all`, each fed `scopeOrSentinel(scope.clinicIds)` exactly as
 * the page does. A manager sees only the clinics they are assigned to.
 * Module permission: `/admin/schedule` maps to `schedule` in
 * `ADMIN_ROUTE_PERMISSIONS` and is not `ownerOnly`, so a manager holding that
 * module passes — the same rule the page applies.
 */
export async function GET() {
  const actor = await requireAdminActor("/admin/schedule");
  if (actor instanceof Response) return actor;

  const clinicIds = scopeOrSentinel(actor.scope.clinicIds);
  const [clinics, schedules, doctorOptions] = await Promise.all([
    listScopedClinics(clinicIds),
    listScopedSchedules(clinicIds),
    listClinicDoctorOptions(clinicIds),
  ]);

  return apiOk({ clinics, schedules, doctorOptions });
}
