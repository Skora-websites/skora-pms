import { getDoctorPatients, getFollowUpReminders, getFollowUps } from "@/lib/queries/doctor";
import { apiOk, anchorDoctorId, requireDoctorModule, resolveDoctorScope } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/doctor/follow-ups — the follow-up queue.
 *
 * Wraps the three helpers `app/doctor/follow-ups/page.tsx:24` reads in its
 * single `Promise.all`, with the same scope resolution: the follow-up lists
 * take the resolved doctor-id set (`listDoctorIdsFor`), while the patient
 * picker takes the practice-anchor id. Module permission: the page's
 * `follow-up` perm.
 */
export async function GET() {
  const user = await requireDoctorModule("follow-up");
  if (user instanceof Response) return user;

  const doctorIds = await resolveDoctorScope(user);
  const [followUps, reminders, patients] = await Promise.all([
    getFollowUps(doctorIds),
    getFollowUpReminders(doctorIds),
    getDoctorPatients(anchorDoctorId(user)),
  ]);

  return apiOk({ followUps, reminders, patients });
}
