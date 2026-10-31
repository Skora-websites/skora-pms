import { getPatientBills } from "@/lib/queries/patient";
import { apiOk, requirePatientActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/patient/bills — the patient's receipts.
 *
 * Wraps `getPatientBills` (lib/queries/patient.ts:8), the helper
 * `app/patient/bills/page.tsx:12` reads. Soft-deleted bills are excluded by
 * the helper itself (`isNull(deletedAt)`).
 */
export async function GET() {
  const user = await requirePatientActor();
  if (user instanceof Response) return user;

  const bills = await getPatientBills(user.id);
  return apiOk(bills);
}
