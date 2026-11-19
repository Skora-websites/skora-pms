import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getPatientById, getPatientPhotoPath } from "@/lib/queries/doctor";
import { getBusinessScope } from "@/lib/auth/scope";
import { requireApiRole } from "@/lib/auth/guard";
import { apiError, apiOk, anchorDoctorId } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/doctor/patients/[id] — one patient's full record.
 *
 * Wraps `getPatientById` (lib/queries/doctor.ts:240) and `getPatientPhotoPath`
 * (lib/queries/doctor.ts:287). The patient is looked up by the session's
 * practice-anchor doctor id, or within the admin/manager's scoped doctors.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiRole(["doctor", "receptionist", "admin", "manager"]);
  if (user instanceof Response) return user;

  const { id } = await params;
  const patientId = Number(id);
  if (!Number.isInteger(patientId)) {
    return apiError("Invalid patient", 400);
  }

  let doctorId = anchorDoctorId(user);
  if (user.role === "admin" || user.role === "manager") {
    const scope = await getBusinessScope();
    if (scope.doctorIds.length === 0) return apiError("Patient not found", 404);
    const [row] = await db
      .select({ referenceRoleId: users.referenceRoleId })
      .from(users)
      .where(
        and(
          eq(users.id, patientId),
          inArray(users.referenceRoleId, scope.doctorIds)
        )
      );
    if (!row?.referenceRoleId) return apiError("Patient not found", 404);
    doctorId = row.referenceRoleId;
  }

  const detail = await getPatientById(doctorId, patientId);
  if (!detail) return apiError("Patient not found", 404);

  const photoPath = await getPatientPhotoPath(detail.patient.id);
  return apiOk({ ...detail, photoPath });
}
