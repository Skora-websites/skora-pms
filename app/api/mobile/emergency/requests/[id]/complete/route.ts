import { NextResponse } from "next/server";
import { completeSos } from "@/lib/dispatch/actions";
import { requireApiRole } from "@/lib/auth/guard";
import { apiError, redirectError } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * POST /api/mobile/emergency/requests/{id}/complete — doctor closes the case.
 *
 * Thin adapter over `completeSos`, which completes the case, syncs the request
 * to `completed`, notifies the patient, then bills inline against the
 * doctor's "Emergency Home Visit" billing type and links the bill to the case.
 *
 * BILLING FAILURE IS SWALLOWED by the action: completion always succeeds so an
 * un-billed case is recoverable afterwards (FR-034). This route therefore has
 * no billing branch and no billing status code.
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
    const result = await completeSos(requestId);
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
