import { NextResponse } from "next/server";
import { cancelPatientAppointment } from "@/app/patient/appointments/actions";
import { requireApiRole } from "@/lib/auth/guard";

import { apiError, redirectError, csrfGuard } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * POST /api/mobile/patient/appointments/{id}/cancel — patient withdraws their
 * own upcoming appointment.
 *
 * Thin adapter over `cancelPatientAppointment`
 * (app/patient/appointments/actions.ts:239), the server action
 * `app/patient/appointments/cancel-appointment-button.tsx:18` calls. Every
 * rule stays inside the action: ownership (`patientId = caller`), the
 * terminal-state guards (already cancelled, completed) and the past/
 * already-started guard. This route only translates the path parameter and
 * the action's result → the JSON envelope, and turns the action guard's
 * `redirect()` into 401/403 so a native client never sees a 307.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // CSRF (audit V4): cancellation is a state change worth protecting from a
  // foreign-origin browser write.
  const forbidden = csrfGuard(request);
  if (forbidden) return forbidden;

  // Same guard the action applies internally (patient role only). Applied
  // here first so an unauthenticated or out-of-role call is refused before
  // any write; the action's own guard stays authoritative.
  const user = await requireApiRole(["patient"]);
  if (user instanceof Response) {
    return apiError(user.status === 401 ? "Unauthorized" : "Forbidden", user.status);
  }

  const { id } = await params;
  const appointmentId = Number(id);
  if (!Number.isInteger(appointmentId) || appointmentId <= 0) {
    // The action's own message for a path it cannot read as an id.
    return apiError("Invalid appointment ID.", 400);
  }

  const statusFor: Record<string, number> = {
    // Validation — the action's own id check.
    "Invalid appointment ID.": 400,
    // Ownership: another patient's appointment is indistinguishable from a
    // miss (the lookup is filtered on `patientId = caller`).
    "Appointment not found.": 404,
    // Terminal + timing states.
    "Appointment is already cancelled.": 409,
    "Completed appointments cannot be cancelled.": 409,
    "Past appointments cannot be cancelled.": 409,
    // The action's own role guard — unreachable behind requireApiRole above,
    // mapped so it answers 403 if it ever fires first.
    "Only patients can cancel appointments.": 403,
  };

  try {
    const state = await cancelPatientAppointment(appointmentId);
    if (state.error) return apiError(state.error, statusFor[state.error] ?? 400);
    return NextResponse.json({ error: null });
  } catch (err) {
    // The action has exactly one `redirect()` — its guard's `/login` — never
    // a success redirect, so only 401/403 are possible here.
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
