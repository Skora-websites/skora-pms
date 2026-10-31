import { NextResponse } from "next/server";
import { setDoctorOnDuty } from "@/lib/dispatch/actions";
import { requireApiRole } from "@/lib/auth/guard";
import { apiError, redirectError } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * PUT /api/mobile/emergency/availability — doctor toggles SOS duty.
 *
 * Thin adapter over `setDoctorOnDuty`, which writes `users.on_duty` — the
 * single column dispatch reads. `clinicOnDuty` and `homeVisitOnDuty` are
 * unrelated toggles and are deliberately never touched here.
 */
export async function PUT(request: Request) {
  const user = await requireApiRole(["doctor"]);
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
  if (typeof raw.onDuty !== "boolean") {
    return apiError("Invalid input.", 400);
  }

  try {
    const result = await setDoctorOnDuty(raw.onDuty);
    if (result.error) return apiError(result.error, 400);
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
