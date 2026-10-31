import { getAllSupportTickets } from "@/lib/queries/support";
import { getSupportVideos } from "@/lib/queries/super-admin";
import { apiOk, requireSuperAdminActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/super/support — every support ticket on the platform plus
 * the help videos.
 *
 * Wraps the two calls `app/super-admin/support/page.tsx:20` makes in its
 * single `Promise.all` — `getAllSupportTickets` (lib/queries/support.ts:6) and
 * `getSupportVideos` (super-admin.ts:377), both platform-wide by design.
 *
 * The CSV export is not re-rendered here: the existing byte route
 * `GET /api/super-admin/support/export` is reused. Ticket triage writes stay
 * with the existing actions.
 */
export async function GET() {
  const user = await requireSuperAdminActor();
  if (user instanceof Response) return user;

  const [tickets, videos] = await Promise.all([
    getAllSupportTickets(),
    getSupportVideos(),
  ]);

  return apiOk({ tickets, videos });
}
