import { getPatientConsultations } from "@/lib/queries/patient";
import { apiOk, requirePatientActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/patient/records — consultation history with diagnosis,
 * medications and follow-up badges.
 *
 * Wraps `getPatientConsultations` (lib/queries/patient.ts:303), the helper
 * `app/patient/records/page.tsx:12` reads — the same rows the health-records
 * page renders, including the grouped medications list the follow-up badges
 * are derived from. The prescription PDF is fetched per row through the
 * existing byte route `GET /api/prescriptions/[id]`.
 */
export async function GET() {
  const user = await requirePatientActor();
  if (user instanceof Response) return user;

  const consultations = await getPatientConsultations(user.id);
  return apiOk(consultations);
}
