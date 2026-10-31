import { getMySosHistory } from "@/lib/dispatch/actions";
import { apiError, apiOk, redirectError, requirePatientActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/patient/emergency/history — the patient's past SOS
 * requests and their outcomes (FR-018).
 *
 * Wraps the existing `getMySosHistory` server action
 * (lib/dispatch/actions.ts:730) — the same action
 * `app/patient/emergency/page.tsx` calls for its history list. It carries its
 * own private `requirePatient` guard, so the role check is NOT re-implemented
 * here: this route applies the existing patient API guard first and then
 * maps any `NEXT_REDIRECT` the action's guard throws to the JSON envelope.
 *
 * The action's own `patientId` scoping (its query filters on the session
 * user's id) is authoritative — the request cannot influence it.
 */
export async function GET() {
  const user = await requirePatientActor();
  if (user instanceof Response) return user;

  try {
    const rows = await getMySosHistory();
    return apiOk(rows);
  } catch (err) {
    const mapped = redirectError(err);
    if (mapped) return mapped;
    return apiError("Could not load emergency history", 500);
  }
}
