import { getAdminNotifications } from "@/app/admin/notifications/actions";
import { apiError, apiOk, redirectError, requireAdminActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/admin/notifications — the admin tier's in-app
 * notifications.
 *
 * Wraps the existing `getAdminNotifications` server action
 * (`app/admin/notifications/actions.ts:26`) that
 * `app/admin/notifications/page.tsx:21` calls. Its own internal gate already
 * checks the admin-tier role and resolves `getBusinessScope()` for the user
 * ids, so no scoping is re-implemented here.
 *
 * **Deliberate pass-through:** `ADMIN_ROUTE_PERMISSIONS` has no entry for
 * `/admin/notifications` (lib/auth/permissions.ts:113-141), so
 * `hasAdminModuleAccess` returns `true` for it — ANY manager passes the
 * layout check. The shared helper mirrors that map verbatim, so this route
 * keeps the same behaviour rather than silently tightening it.
 */
export async function GET() {
  const actor = await requireAdminActor("/admin/notifications");
  if (actor instanceof Response) return actor;

  try {
    const notifications = await getAdminNotifications();
    return apiOk(notifications);
  } catch (err) {
    const mapped = redirectError(err);
    if (mapped) return mapped;
    return apiError("Could not load notifications", 500);
  }
}
