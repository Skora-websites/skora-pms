import { getPatientById, getPatientPhotoPath } from "@/lib/queries/doctor";
import { apiError, apiOk, anchorDoctorId, requireDoctorModule } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/doctor/patients/[id] — one patient's full record.
 *
 * Wraps `getPatientById` (lib/queries/doctor.ts:240) and `getPatientPhotoPath`
 * (lib/queries/doctor.ts:287) exactly as
 * `app/doctor/patients/[id]/page.tsx:28,32` calls them. The patient is looked
 * up by the session's practice-anchor doctor id, so a patient belonging to
 * another practice is indistinguishable from a missing one (404). The photo
 * bytes are not re-served — the existing byte route
 * `GET /api/doctor/patients/[id]/photo` is used instead.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireDoctorModule("registrations");
  if (user instanceof Response) return user;

  const { id } = await params;
  const patientId = Number(id);
  if (!Number.isInteger(patientId)) {
    return apiError("Invalid patient", 400);
  }

  const detail = await getPatientById(anchorDoctorId(user), patientId);
  if (!detail) return apiError("Patient not found", 404);

  const photoPath = await getPatientPhotoPath(detail.patient.id);
  return apiOk({ ...detail, photoPath });
}
