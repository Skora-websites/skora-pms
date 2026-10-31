import { getRecentPackagePayments } from "@/lib/packages/fulfillment";
import { apiOk, requireSuperAdminActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/super/payments — the platform's recent package payments.
 *
 * Wraps `getRecentPackagePayments` (lib/packages/fulfillment.ts:144), the
 * only super-admin read that lives outside `lib/queries/*` — the page calls
 * it directly with the same limit, so this route keeps it rather than
 * re-querying `package_payments` itself.
 *
 * Ordering and verification stay on the existing routes
 * `POST /api/packages/order` and `POST /api/packages/verify` — a super-admin
 * never creates a payment on someone's behalf here.
 */
export async function GET() {
  const user = await requireSuperAdminActor();
  if (user instanceof Response) return user;

  const payments = await getRecentPackagePayments(100);
  return apiOk(payments);
}
