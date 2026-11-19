import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { setDoctorOnDuty } from "@/lib/dispatch/actions";
import { requireApiRole } from "@/lib/auth/guard";
import { apiError, redirectError } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * PUT /api/mobile/emergency/availability — doctor toggles SOS duty and/or Home Visit duty.
 * Body: { onDuty?: boolean; homeVisitOnDuty?: boolean; latitude?: number; longitude?: number }
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

  if (typeof raw.onDuty !== "boolean" && typeof raw.homeVisitOnDuty !== "boolean") {
    return apiError("Expected onDuty or homeVisitOnDuty boolean.", 400);
  }

  try {
    // 1. If onDuty is provided, call setDoctorOnDuty
    if (typeof raw.onDuty === "boolean") {
      const coords =
        typeof raw.latitude === "number" && typeof raw.longitude === "number"
          ? { latitude: raw.latitude, longitude: raw.longitude }
          : undefined;
      const result = await setDoctorOnDuty(raw.onDuty, coords);
      if (result.error) return apiError(result.error, 400);
    }

    // 2. If homeVisitOnDuty is provided, update database
    if (typeof raw.homeVisitOnDuty === "boolean") {
      await db
        .update(users)
        .set({
          homeVisitOnDuty: raw.homeVisitOnDuty,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
    }

    return NextResponse.json({ error: null });
  } catch (err) {
    const guarded = redirectError(err);
    if (guarded) {
      return apiError(
        guarded.status === 401 ? "Unauthorized" : "Forbidden",
        guarded.status
      );
    }
    throw err;
  }
}
