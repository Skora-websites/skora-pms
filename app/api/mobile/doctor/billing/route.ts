import { getBillingOverview, getDoctorPatients } from "@/lib/queries/doctor";
import { apiOk, anchorDoctorId, requireDoctorModule, resolveDoctorScope } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/doctor/billing — the practice's bills and billing types.
 *
 * Wraps the two calls `app/doctor/billing/page.tsx:25` makes in its single
 * `Promise.all`. The bills list is scoped through `listDoctorIdsFor` (the
 * practice for a clinic owner / their receptionist, strictly `[ownId]` for a
 * member doctor); the patient picker uses the practice-anchor id, exactly as
 * the page does. The bill PDFs are NOT re-served here — the existing byte
 * route `GET /api/doctor/billing/[id]/pdf` is used per row.
 */
export async function GET() {
  const user = await requireDoctorModule("billing");
  if (user instanceof Response) return user;

  const doctorIds = await resolveDoctorScope(user);
  const [{ bills, billingTypes }, patients] = await Promise.all([
    getBillingOverview(doctorIds),
    getDoctorPatients(anchorDoctorId(user)),
  ]);

  return apiOk({ bills, billingTypes, patients });
}
