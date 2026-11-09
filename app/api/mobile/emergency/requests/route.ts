import { NextResponse } from "next/server";
import { triggerSos } from "@/lib/dispatch/actions";
import { requireApiRole } from "@/lib/auth/guard";

import { apiError, redirectError, csrfGuard } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * POST /api/mobile/emergency/requests — patient raises an SOS.
 *
 * Thin adapter over `triggerSos` (lib/dispatch/actions.ts). The action owns
 * every rule: the sosSchema bounds, the 1/min per-patient rate limit, the
 * duplicate-active-request guard, the offer fan-out, the SSE broadcast and
 * the audit log. This route only translates JSON → FormData and the action's
 * result → the JSON envelope, and turns the action guard's `redirect()` into
 * 401/403 so a native client never sees a 307.
 *
 * FormData keys are snake_case (`radius_km`) because that is the shape
 * triggerSos parses; a synthetic `{ error: null }` stands in for the
 * `useActionState` prev argument the web form supplies.
 *
 * NOTE FOR CALLERS: `{ error: null, requestId }` does NOT mean a doctor was
 * found — when no on-duty doctor is inside the radius the row is inserted and
 * immediately expired. Follow with GET /api/patient/sos/status/{id}.
 */
export async function POST(request: Request) {
  // CSRF (audit V4): a foreign Origin means a browser page is driving this
  // write with the signed-in user's session cookie. No Origin at all is a
  // native client fetch, which cannot be CSRF'd, so it passes untouched.
  const forbidden = csrfGuard(request);
  if (forbidden) return forbidden;
  // Same guard triggerSos applies internally (patient role only, never a
  // receptionist). Applied here as the existing exported route guard so an
  // unauthenticated or out-of-role call is refused before any write.
  const user = await requireApiRole(["patient"]);
  if (user instanceof Response) {
    return apiError(user.status === 401 ? "Unauthorized" : "Forbidden", user.status);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid input.", 400);
  }
  const raw = (body ?? {}) as Record<string, unknown>;

  // Presence/finite gate only — the numeric bounds, the radius default and
  // the length caps stay in `sosSchema` inside triggerSos, which is the
  // enforcing side. A payload triggerSos could not read is refused here with
  // the schema's own fallback string rather than invented copy.
  const latitude = Number(raw.latitude);
  const longitude = Number(raw.longitude);
  const radiusKm = raw.radiusKm == null ? 10 : Number(raw.radiusKm);
  if (
    raw.latitude == null ||
    raw.latitude === "" ||
    raw.longitude == null ||
    raw.longitude === "" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    !Number.isFinite(radiusKm)
  ) {
    return apiError("Invalid input.", 400);
  }
  const complaint = raw.complaint == null ? null : String(raw.complaint);
  const notes = raw.notes == null ? null : String(raw.notes);

  const formData = new FormData();
  formData.set("latitude", String(latitude));
  formData.set("longitude", String(longitude));
  formData.set("radius_km", String(radiusKm));
  if (complaint) formData.set("complaint", complaint);
  if (notes) formData.set("notes", notes);

  const statusFor: Record<string, number> = {
    "Too many SOS requests. Please wait a minute.": 429,
    "You already have an active SOS request. Cancel it before triggering a new one.": 409,
  };

  try {
    const result = await triggerSos({ error: null }, formData);
    if (result.error) return apiError(result.error, statusFor[result.error] ?? 400);
    return NextResponse.json({ error: null, requestId: result.requestId });
  } catch (err) {
    const guarded = redirectError(err);
    if (guarded) {
      // The shared detector answers "was this the guard's redirect"; the
      // failure envelope for these routes is JSON, so map its status back.
      return apiError(
        guarded.status === 401 ? "Unauthorized" : "Forbidden",
        guarded.status
      );
    }
    throw err;
  }
}
