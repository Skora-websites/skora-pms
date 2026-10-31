import { listBusinessProfiles, scopeOrSentinel } from "@/lib/queries/admin";
import { apiOk, requireAdminActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/admin/business-settings — the business profile rows for the
 * viewer's businesses.
 *
 * Wraps `listBusinessProfiles` (lib/queries/admin.ts:662) with
 * `scopeOrSentinel(scope.businessIds)`, exactly as
 * `app/admin/settings/page.tsx:21` does. `/admin/settings` is an `ownerOnly`
 * module in `ADMIN_ROUTE_PERMISSIONS`, so a manager is refused server-side
 * rather than merely hidden in the app. Writes stay with the existing
 * `saveBusinessSettings` action — this namespace is read-only for settings.
 */
export async function GET() {
  const actor = await requireAdminActor("/admin/settings");
  if (actor instanceof Response) return actor;

  const businesses = await listBusinessProfiles(
    scopeOrSentinel(actor.scope.businessIds)
  );

  return apiOk(businesses);
}
