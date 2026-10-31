import { getSupportTickets } from "@/lib/queries/doctor";
import { apiOk, requireAdminActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/admin/support — the support tickets the viewer can see.
 *
 * Reproduces `app/admin/support/page.tsx:25-29` exactly: it unions the
 * viewer's own user id with the scope's doctor ids and issues one
 * `getSupportTickets` call per id, then merges and dedupes in JS the same way
 * the page does. Scoping is entirely derived from `getBusinessScope()` — no
 * ticket owner is ever taken from the request.
 */
export async function GET() {
  const actor = await requireAdminActor("/admin/support");
  if (actor instanceof Response) return actor;

  const viewerIds = [actor.user.id, ...actor.scope.doctorIds];
  const uniqueIds = [...new Set(viewerIds)];

  const perUser = await Promise.all(
    uniqueIds.map((id) => getSupportTickets(id))
  );

  // Same merge/dedupe/sort the page performs before rendering: keep the first
  // occurrence of each ticket id, then newest-first.
  const seen = new Set<number>();
  const tickets = perUser
    .flat()
    .filter((ticket) => {
      if (seen.has(ticket.id)) return false;
      seen.add(ticket.id);
      return true;
    })
    .sort((a, b) =>
      (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
    );

  return apiOk(tickets);
}
