import { NextResponse } from "next/server";
import { markSosArrived } from "@/lib/dispatch/actions";
import { requireApiRole } from "@/lib/auth/guard";
import { apiError, csrfGuard, redirectError } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * POST /api/mobile/emergency/requests/{id}/arrived — doctor marks arrival.
 *
 * Thin adapter over `markSosArrived`, which records the arrival timestamp the
 * patient tracker reads. This is deliberately separate from OTP verification
 * so "doctor is here" and "identity confirmed" stay independently observable.
 *
 * Both this route and verify-otp emit the identical SSE frame
 * `{"type":"sos:status","status":"accepted"}` — the patient client cannot
 * distinguish arrival from identity confirmation from a frame and must refetch
 * GET /api/patient/sos/status/{id} and diff arrivedAt / otpVerifiedAt.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // CSRF (audit V4): a foreign Origin means a browser page is driving this write
  // with the signed-in user's session cookie. No Origin at all is a native
  // client fetch, which cannot be CSRF'd, so it passes untouched.
  const forbidden = csrfGuard(request);
  if (forbidden) return forbidden;
  const user = await requireApiRole(["doctor"]);
  if (user instanceof Response) {
    return apiError(user.status === 401 ? "Unauthorized" : "Forbidden", user.status);
  }

  const { id } = await params;
  const requestId = Number(id);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return apiError("Invalid request.", 400);
  }

  const statusFor: Record<string, number> = {
    "Case not found.": 404,
    "Already marked as arrived.": 409,
  };

  try {
    const result = await markSosArrived(requestId);
    if (result.error) return apiError(result.error, statusFor[result.error] ?? 400);
    return NextResponse.json({ error: null });
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
