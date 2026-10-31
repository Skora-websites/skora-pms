import { listAllBusinesses } from "@/lib/queries/admin";
import { apiOk, requireSuperAdminActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/super/businesses — every business on the platform.
 *
 * Wraps `listAllBusinesses` (lib/queries/admin.ts:702), the helper
 * `app/super-admin/businesses/page.tsx:15` calls. It is platform-wide by
 * design and takes no scoping argument — the super-admin tier is the one role
 * whose scope is the whole platform, so `getBusinessScope()` must NOT be
 * applied here. Guard: `requireRole(["super_admin"])` on the page, so the
 * equivalent `requireApiRole(["super_admin"])`.
 */
export async function GET() {
  const user = await requireSuperAdminActor();
  if (user instanceof Response) return user;

  const businesses = await listAllBusinesses();
  return apiOk(businesses);
}
