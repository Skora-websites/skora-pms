import { getPatientPrescriptions } from "@/lib/queries/patient";
import { apiOk, requirePatientActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/patient/prescriptions — the patient's consultations and
 * their prescription PDFs.
 *
 * Wraps `getPatientPrescriptions` (lib/queries/patient.ts:49), the helper
 * `app/patient/prescriptions/page.tsx:12` reads. The PDF bytes are NOT
 * re-served here: the client opens the existing byte route
 * `GET /api/prescriptions/[consultationId]` for each row's `id`.
 */
export async function GET() {
  const user = await requirePatientActor();
  if (user instanceof Response) return user;

  const prescriptions = await getPatientPrescriptions(user.id);
  return apiOk(prescriptions);
}
