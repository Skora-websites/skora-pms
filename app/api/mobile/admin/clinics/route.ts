import {
  countDoctorsPerClinic,
  countSchedulesPerClinic,
  listManagersPerClinic,
  listScopedClinics,
  scopeOrSentinel,
} from "@/lib/queries/admin";
import { apiOk, requireAdminActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/admin/clinics — the clinic list with doctors, schedules
 * and managers per clinic.
 *
 * Wraps the four calls `app/admin/clinics/page.tsx:24-30` makes in its single
 * `Promise.all`, each fed `scopeOrSentinel(scope.clinicIds)` exactly as the
 * page does. `/admin/clinics` is an `ownerOnly` module in
 * `ADMIN_ROUTE_PERMISSIONS`, so a manager is refused server-side by
 * `requireAdminActor` (never merely hidden in the app). Deactivation is a soft
 * delete — the existing `setClinicActive` action owns it, not this read.
 */
export async function GET() {
  const actor = await requireAdminActor("/admin/clinics");
  if (actor instanceof Response) return actor;

  const clinicIds = scopeOrSentinel(actor.scope.clinicIds);
  const [clinics, doctors, schedules, managers] = await Promise.all([
    listScopedClinics(clinicIds),
    countDoctorsPerClinic(clinicIds),
    countSchedulesPerClinic(clinicIds),
    listManagersPerClinic(clinicIds),
  ]);

  return apiOk({ clinics, doctorsPerClinic: doctors, schedulesPerClinic: schedules, managersPerClinic: managers });
}
