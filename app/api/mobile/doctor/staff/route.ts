import {
  listPracticeReceptionists,
  listPracticeRoleOptions,
  listRoleAssignments,
} from "@/lib/queries/admin";
import { apiOk, anchorDoctorId, requireDoctorModule } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/doctor/staff — the practice's receptionist roster with each
 * member's role name.
 *
 * Wraps the three calls `app/doctor/staff/page.tsx:18,25` makes, all anchored
 * on the session's practice-anchor doctor id. Module permission: the page's
 * `roles-permissions` perm — the same one the existing
 * `GET /api/doctor/staff/[id]/permissions` route uses.
 *
 * Attendance and per-member permissions are not re-implemented here: the
 * existing routes `GET /api/doctor/staff/attendance`,
 * `GET /api/doctor/staff/attendance/report` and
 * `GET /api/doctor/staff/[id]/permissions` are reused.
 */
export async function GET() {
  const user = await requireDoctorModule("roles-permissions");
  if (user instanceof Response) return user;

  const doctorId = anchorDoctorId(user);
  const [staff, practiceRoles] = await Promise.all([
    listPracticeReceptionists(doctorId),
    listPracticeRoleOptions(doctorId),
  ]);

  const roleRows = await listRoleAssignments(practiceRoles.map((r) => r.id));
  const roleNameById = new Map(practiceRoles.map((r) => [r.id, r.name]));
  const roleOfStaff = new Map<number, string>();
  for (const rr of roleRows) {
    if (!roleOfStaff.has(rr.modelId)) {
      const name = roleNameById.get(rr.roleId);
      if (name) roleOfStaff.set(rr.modelId, name);
    }
  }
  // The same derivation the page performs in JS — no extra query.
  const rows = staff.map((s) => ({ ...s, roleName: roleOfStaff.get(s.id) ?? null }));

  return apiOk({ staff: rows, roles: practiceRoles });
}
