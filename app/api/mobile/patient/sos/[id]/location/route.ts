import { refreshPatientLocation } from "@/lib/dispatch/actions";
import { requirePatientActor, apiError, apiOk, csrfGuard, redirectError } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * POST /api/mobile/patient/sos/{id}/location — refresh the patient's own
 * pickup point while a case is open (audit P8).
 *
 * WHY: the pickup coordinate was frozen at trigger time, so a patient who
 * moved — walked to the building gate, told to wait under a lamp post, or
 * simply standing somewhere else after ten minutes — could not correct it.
 * The doctor's ETA and the case's distance basis both keyed off the stale
 * value. The native app is the one most affected, since it has no server
 * action to call.
 *
 * Ownership is enforced inside the action: the row is updated only where the
 * request's patient_id matches the authenticated patient AND the case is open,
 * so a completed case's distance basis can never be rewritten.
 *
 * Body: { latitude: number, longitude: number }
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // CSRF (audit V4) — same convention as every other state-changing route in
  // this namespace. Native-app fetches carry no Origin header, so they pass
  // untouched; a browser POST from a foreign origin is refused before any
  // state changes.
  const forbidden = csrfGuard(request);
  if (forbidden) return forbidden;

  const actor = await requirePatientActor();
  if (actor instanceof Response) return actor;

  const { id } = await params;
  const requestId = Number(id);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return apiError("Invalid request.", 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid input.", 400);
  }
  const raw = (body ?? {}) as Record<string, unknown>;
  // A missing or non-numeric coordinate lands as NaN so the action's own
  // "Invalid location." / "Invalid coordinates." messages apply.
  const latitude = typeof raw.latitude === "number" ? raw.latitude : Number.NaN;
  const longitude = typeof raw.longitude === "number" ? raw.longitude : Number.NaN;

  const statusFor: Record<string, number> = {
    "Invalid request.": 400,
    "Invalid location.": 400,
    "Invalid coordinates.": 400,
    "This emergency case is not yours to update.": 403,
  };

  try {
    // Reuses the same action the web tracker calls, so ownership scoping, the
    // ping throttle and the ETA recomputation cannot drift between the two
    // clients.
    const form = new FormData();
    form.set("requestId", String(requestId));
    form.set("latitude", String(latitude));
    form.set("longitude", String(longitude));
    const result = await refreshPatientLocation({ error: null }, form);
    if (result.error) return apiError(result.error, statusFor[result.error] ?? 400);
    return apiOk({
      etaMinutes: result.etaMinutes ?? null,
      throttled: result.throttled ?? false,
      etaBasis: result.etaBasis ?? null,
    });
  } catch (err) {
    const guarded = redirectError(err);
    if (guarded) return apiError("Forbidden", guarded.status);
    throw err;
  }
}
