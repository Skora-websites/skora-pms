import {
  listAllReceptionistsWithAnchor,
  listClinicMembers,
  listScopedClinicNames,
  scopeOrSentinel,
} from "@/lib/queries/admin";
import { apiOk, requireAdminActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/admin/staff — the doctor roster per clinic and the
 * receptionist accounts.
 *
 * Wraps the calls `app/admin/staff/page.tsx:38-42` makes. As the page does,
 * `listClinicMembers` and `listScopedClinicNames` take the scoped clinic ids,
 * while `listAllReceptionistsWithAnchor` is a platform-wide read the page then
 * filters with the scope's doctor ids — reproduced here rather than silently
 * re-scoped, so an owner sees the same rows on both surfaces.
 *
 * `/admin/staff` maps to the `roles-permissions` module in
 * `ADMIN_ROUTE_PERMISSIONS` and is NOT marked `ownerOnly`, so a manager
 * holding that module passes — the same rule the page applies.
 */
export async function GET() {
  const actor = await requireAdminActor("/admin/staff");
  if (actor instanceof Response) return actor;

  const clinicIds = scopeOrSentinel(actor.scope.clinicIds);
  const [members, clinicNames, receptionists] = await Promise.all([
    listClinicMembers(clinicIds),
    listScopedClinicNames(clinicIds),
    listAllReceptionistsWithAnchor(),
  ]);

  // Same in-JS filter the page applies.
  const doctorIds = actor.scope.doctorIds;
  const scopedReceptionists = receptionists.filter(
    (r) =>
      r.referenceRoleId !== null && doctorIds.includes(r.referenceRoleId)
  );

  return apiOk({
    members,
    clinicNames,
    receptionists: scopedReceptionists,
  });
}
