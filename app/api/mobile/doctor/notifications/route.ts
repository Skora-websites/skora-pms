import { getNotifications } from "@/app/doctor/notifications/actions";
import { apiError, apiOk, redirectError, requireDoctorModule } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/doctor/notifications — the dashboard's in-app
 * notifications.
 *
 * Wraps the existing `getNotifications` server action
 * (`app/doctor/notifications/actions.ts:29`) that
 * `app/doctor/notifications/page.tsx:13` calls. Its own internal gate
 * (`getDoctorId`, actions.ts:20) already applies the `dashboard` module
 * permission the page maps to and resolves the practice-anchor doctor id, so
 * the permission check is NOT re-implemented here — this route applies the
 * page-equivalent guard first, then maps any `NEXT_REDIRECT` the action's
 * guard throws to the JSON envelope.
 */
export async function GET() {
  const user = await requireDoctorModule("dashboard");
  if (user instanceof Response) return user;

  try {
    const notifications = await getNotifications();
    return apiOk(notifications);
  } catch (err) {
    const mapped = redirectError(err);
    if (mapped) return mapped;
    return apiError("Could not load notifications", 500);
  }
}
