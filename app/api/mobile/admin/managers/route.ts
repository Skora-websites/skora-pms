import {
  listDirectManagerPermissions,
  listManagerAssignments,
  listManagerUsersInScope,
  listScopedClinics,
  scopeOrSentinel,
} from "@/lib/queries/admin";
import { apiOk, requireAdminActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/admin/managers — the manager roster for the viewer's
 * businesses.
 *
 * Wraps the calls `app/admin/managers/page.tsx:22-30` makes, with the same
 * `scopeOrSentinel` wrapping. `/admin/managers` is an `ownerOnly` module in
 * `ADMIN_ROUTE_PERMISSIONS`, so a manager is refused server-side.
 *
 * Note the page itself acknowledges (source comment, lines 27-29) that
 * `listDirectManagerPermissions` is a platform-wide read filtered in JS to
 * scoped manager ids. That behaviour is reproduced here rather than silently
 * re-scoped, so an owner sees exactly the same rows on both surfaces.
 */
export async function GET() {
  const actor = await requireAdminActor("/admin/managers");
  if (actor instanceof Response) return actor;

  const businessIds = scopeOrSentinel(actor.scope.businessIds);
  const clinicIds = scopeOrSentinel(actor.scope.clinicIds);
  const [assignments, clinics, users, directPermissions] = await Promise.all([
    listManagerAssignments(businessIds),
    listScopedClinics(clinicIds),
    listManagerUsersInScope(clinicIds),
    listDirectManagerPermissions(),
  ]);

  return apiOk({
    assignments,
    clinics,
    managerUsers: users,
    directPermissions,
  });
}
