import { NextResponse } from "next/server";
import { updateDoctorLocation } from "@/lib/dispatch/actions";
import { requireApiRole } from "@/lib/auth/guard";
import { apiError, redirectError } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * POST /api/mobile/emergency/requests/{id}/location — doctor reports position.
 *
 * Thin adapter over `updateDoctorLocation`, which owns the coordinate
 * validation and, critically, the ETA: it recomputes `etaMinutes` from the
 * newly reported position against the patient's stored position at 30 km/h
 * with a 1-minute floor, and writes doctorLatitude / doctorLongitude /
 * doctorLastSeenAt / etaMinutes ONLY while `sos_cases.status === 'open'`.
 * The client never computes an ETA, so `etaMinutes` comes back `undefined`
 * once the case closes (treat `undefined` and `null` alike).
 *
 * No rate limit applies — the web client reports roughly every 5 s.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiRole(["doctor"]);
  if (user instanceof Response) {
    return apiError(user.status === 401 ? "Unauthorized" : "Forbidden", user.status);
  }

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
  // A missing or non-numeric coordinate is handed to the action as NaN so its
  // own "Invalid location." / "Invalid coordinates." messages apply.
  const latitude = typeof raw.latitude === "number" ? raw.latitude : Number.NaN;
  const longitude = typeof raw.longitude === "number" ? raw.longitude : Number.NaN;

  const statusFor: Record<string, number> = {
    "Invalid request.": 400,
    "Invalid location.": 400,
    "Invalid coordinates.": 400,
  };

  try {
    const result = await updateDoctorLocation(requestId, latitude, longitude);
    if (result.error) return apiError(result.error, statusFor[result.error] ?? 400);
    return NextResponse.json({ error: null, etaMinutes: result.etaMinutes });
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
