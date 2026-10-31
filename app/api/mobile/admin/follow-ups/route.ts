import { getFollowUpReminders, getFollowUps } from "@/lib/queries/doctor";
import { listPatientOptions } from "@/lib/queries/admin";
import { apiOk, requireAdminActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/admin/follow-ups — every follow-up in the viewer's scope.
 *
 * Wraps the three calls `app/admin/follow-ups/page.tsx:16-22` makes in its
 * single `Promise.all`, all fed `scope.doctorIds`. The page fetches every row
 * and splits pending/done in JS — that split is reproduced there, so this
 * route returns the raw lists plus the patient options the form needs.
 */
export async function GET() {
  const actor = await requireAdminActor("/admin/follow-ups");
  if (actor instanceof Response) return actor;

  const [followUps, reminders, patients] = await Promise.all([
    getFollowUps(actor.scope.doctorIds),
    getFollowUpReminders(actor.scope.doctorIds),
    listPatientOptions(actor.scope.doctorIds),
  ]);

  return apiOk({ followUps, reminders, patients });
}
