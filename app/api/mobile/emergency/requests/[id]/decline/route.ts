import { NextResponse } from "next/server";
import { declineSos } from "@/lib/dispatch/actions";
import { requireApiRole } from "@/lib/auth/guard";
import { apiError, redirectError } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * POST /api/mobile/emergency/requests/{id}/decline — doctor declines an offer.
 *
 * Thin adapter over `declineSos`, whose `UPDATE … WHERE status='broadcast'` is
 * guarded on the offer still being a live broadcast, so a repeated decline is
 * a no-op (idempotent, per FR-027) and the request stays available to the
 * other offered doctors.
 */
export async function POST(
  _request: Request,
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

  try {
    const result = await declineSos(requestId);
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
