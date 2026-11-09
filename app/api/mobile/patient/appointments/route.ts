import { NextResponse } from "next/server";
import { createPatientAppointment } from "@/app/patient/appointments/actions";
import { getPatientAppointments } from "@/lib/queries/patient";
import { requireApiRole } from "@/lib/auth/guard";

import { apiError, apiOk, redirectError, csrfGuard } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/patient/appointments — the patient's appointment list.
 *
 * Wraps `getPatientAppointments` (lib/queries/patient.ts:215), the helper
 * `app/patient/appointments/page.tsx` reads. Unbounded, like every other
 * patient read route; the web page and the app both truncate for display.
 *
 * RESTORED after a collision: the booking route below was originally added to
 * this file, which silently removed this handler and answered GET with 405.
 * Both live in one file because Next.js resolves them from one module.
 */
export async function GET() {
  const user = await requireApiRole(["patient"]);
  if (user instanceof Response) return user;

  const appointments = await getPatientAppointments(user.id);
  return apiOk(appointments);
}

/**
 * POST /api/mobile/patient/appointments — patient books an appointment.
 *
 * Thin adapter over `createPatientAppointment`
 * (app/patient/appointments/actions.ts:63), the server action
 * `app/patient/appointments/book/book-form.tsx:34` submits through
 * `useActionState`. Every rule stays inside the action: field validation, the
 * past/future checks, doctor existence, active-clinic + weekday-schedule
 * availability, the duplicate-booking finder, and the doctor-row-lock insert
 * that closes the double-booking race. This route only translates JSON →
 * FormData and the action's result → the JSON envelope, and turns the action
 * guard's `redirect()` into 401/403 so a native client never sees a 307.
 *
 * FormData keys are the form's own input names (`doctor_id`, `date`, `time`,
 * `case_type`) because that is what the action reads; a synthetic
 * `{ error: null }` stands in for the `useActionState` prev argument the web
 * form supplies. No rate limit exists here — the action has none, so no 429
 * message is invented for one.
 *
 * Success is signalled by `redirect("/patient/appointments?created=1")`
 * (actions.ts:234-235): the action has no success return value, so the
 * redirect target — not a 403 blanket mapping — decides the outcome.
 */
export async function POST(request: Request) {
  // CSRF (audit V4): a foreign Origin means a browser page is driving this
  // booking write with the signed-in user's session cookie.
  const forbidden = csrfGuard(request);
  if (forbidden) return forbidden;
  // Same guard the action applies internally (patient role only). Applied
  // here first so an unauthenticated or out-of-role call is refused before
  // any write; the action's own guard stays authoritative.
  const user = await requireApiRole(["patient"]);
  if (user instanceof Response) {
    return apiError(user.status === 401 ? "Unauthorized" : "Forbidden", user.status);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    // The established fallback for a body this namespace cannot read.
    return apiError("Invalid input.", 400);
  }
  const raw = (body ?? {}) as Record<string, unknown>;
  // Every value is handed to the action exactly as its FormData parsing
  // expects, so the action's own strings apply — this route pre-checks
  // nothing and duplicates no rule. `case_type` is the one key the action
  // defaults (to `clinical_visit` when absent), so it is only set when the
  // caller actually sends it.
  const formData = new FormData();
  formData.set("doctor_id", String(raw.doctorId ?? ""));
  formData.set("date", String(raw.date ?? ""));
  formData.set("time", String(raw.time ?? ""));
  if (raw.caseType !== undefined) formData.set("case_type", String(raw.caseType));

  const statusFor: Record<string, number> = {
    // Field validation.
    "Please choose a doctor.": 400,
    "Invalid date.": 400,
    "Invalid time.": 400,
    "Invalid visit type.": 400,
    "Date cannot be in the past.": 400,
    "Appointment time must be in the future.": 400,
    // Referenced resource state.
    "Doctor not found.": 404,
    "This doctor has no active clinic.": 404,
    // Availability.
    "The doctor is not available on this day. Please choose another date.": 409,
    "The selected time is outside the doctor's available schedule.": 409,
    // The action's own role guard — unreachable behind requireApiRole above,
    // mapped so it answers 403 if it ever fires first.
    "Only patients can book appointments.": 403,
  };

  try {
    const state = await createPatientAppointment({ error: null }, formData);
    if (state.error) {
      // Three conflict messages are built per row — `duplicateBookingError()`
      // embeds the hit appointment id, and the doctor-row-lock insert names
      // the slot — so they are classified by their fixed prefix rather than
      // exact match. Everything unmapped is a validation failure.
      const status =
        statusFor[state.error] ??
        (state.error.startsWith("Duplicate booking") ||
        state.error.startsWith("Time slot ")
          ? 409
          : 400);
      return apiError(state.error, status);
    }
    // Unreachable today: the action returns early on failure and redirects on
    // success. Kept so the action's own state type is honoured verbatim.
    return NextResponse.json({ error: null });
  } catch (err) {
    // The action redirects in exactly two places: its guard's `/login`
    // (unauthenticated) and the success branch's appointments page. Both
    // arrive as NEXT_REDIRECT throws, so the destination decides which this
    // is — the appointments page means the insert committed.
    if (isBookingCommittedRedirect(err)) {
      return NextResponse.json({ error: null });
    }
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

/**
 * Decodes a NEXT_REDIRECT digest the way Next's own
 * `getURLFromRedirectError` does (`split(";").slice(2, -2).join(";")`) and
 * reports whether the action signalled a committed booking by redirecting to
 * the patient's appointments page.
 */
function isBookingCommittedRedirect(err: unknown): boolean {
  if (typeof err !== "object" || err === null || !("digest" in err)) return false;
  const { digest } = err as { digest: unknown };
  if (typeof digest !== "string" || !digest.startsWith("NEXT_REDIRECT")) return false;
  return digest.split(";").slice(2, -2).join(";") === "/patient/appointments?created=1";
}
