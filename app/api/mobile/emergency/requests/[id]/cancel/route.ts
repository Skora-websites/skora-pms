import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sosRequests } from "@/lib/db/schema";
import { cancelSos } from "@/lib/dispatch/actions";
import { requireApiRole } from "@/lib/auth/guard";
import { apiError, redirectError } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * POST /api/mobile/emergency/requests/{id}/cancel — patient withdraws.
 *
 * Thin adapter over `cancelSos`, whose conditional update is guarded on
 * `patientId = caller AND status='pending'` — owner-only, and only while the
 * request is still open (FR-015: there is no accepted → cancelled transition,
 * so withdrawal is refused once a doctor has accepted).
 *
 * `cancelSos` has no failure branch at all — it returns `{ error: null }`
 * whether or not the conditional update matched — so this route reads the row
 * to tell the three outcomes apart: not found / not the owner → 404
 * (indistinguishable from a genuine miss, exactly like the patient status
 * route), already cancelled or expired → idempotent 200, and accepted or
 * completed → 409 on the one message the app authors rather than reuses.
 * The action still makes the actual write, so the ownership and pending-only
 * rules never move into this file.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiRole(["patient"]);
  if (user instanceof Response) {
    return apiError(user.status === 401 ? "Unauthorized" : "Forbidden", user.status);
  }

  const { id } = await params;
  const requestId = Number(id);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return apiError("Invalid request.", 400);
  }

  const [existing] = await db
    .select({ patientId: sosRequests.patientId, status: sosRequests.status })
    .from(sosRequests)
    .where(eq(sosRequests.id, requestId))
    .limit(1);
  // IDOR-safe: any other patient's request is indistinguishable from a miss.
  if (!existing || existing.patientId !== user.id) {
    return apiError("Emergency request not found.", 404);
  }
  // Terminal states — nothing left to withdraw, and nothing to write, so the
  // action's broadcast/audit are not replayed for a request already resolved.
  if (existing.status === "cancelled" || existing.status === "expired") {
    return NextResponse.json({ error: null });
  }
  if (existing.status === "accepted" || existing.status === "completed") {
    return apiError(
      "You can no longer cancel — a doctor is already on the way.",
      409
    );
  }

  try {
    await cancelSos(requestId);
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

  // The conditional UPDATE above wins the race: re-read to confirm the caller
  // is not told "cancelled" when a concurrent accept took the request first.
  const [after] = await db
    .select({ status: sosRequests.status })
    .from(sosRequests)
    .where(and(eq(sosRequests.id, requestId), eq(sosRequests.patientId, user.id)))
    .limit(1);
  if (!after || after.status !== "cancelled") {
    return apiError(
      "You can no longer cancel — a doctor is already on the way.",
      409
    );
  }
  return NextResponse.json({ error: null });
}
