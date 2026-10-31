import { getBillingOverview, getDoctorPatients } from "@/lib/queries/doctor";
import { apiOk, requireAdminActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/admin/billing — every bill in the viewer's scope.
 *
 * Wraps the two calls `app/admin/billing/page.tsx:23-26` makes. The bills
 * list is scoped through `getBusinessScope().doctorIds`; the patient picker
 * is scoped to the first doctor of that scope, exactly as the page does (the
 * source quirk is reproduced rather than silently widened).
 *
 * The bill PDFs are NOT re-served here — the existing byte route
 * `GET /api/doctor/billing/[id]/pdf` is used per row.
 */
export async function GET() {
  const actor = await requireAdminActor("/admin/billing");
  if (actor instanceof Response) return actor;

  const doctorIds = actor.scope.doctorIds;
  const [{ bills, billingTypes }, patients] = await Promise.all([
    getBillingOverview(doctorIds),
    getDoctorPatients(doctorIds[0] ?? 0),
  ]);

  return apiOk({ bills, billingTypes, patients });
}
