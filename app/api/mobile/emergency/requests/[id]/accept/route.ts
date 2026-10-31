import { NextResponse } from "next/server";
import { acceptSos } from "@/lib/dispatch/actions";
import { requireApiRole } from "@/lib/auth/guard";
import { apiError, redirectError } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * POST /api/mobile/emergency/requests/{id}/accept — doctor claims a request.
 *
 * Thin adapter over `acceptSos` (lib/dispatch/actions.ts). Every rule stays
 * inside the action: the offer-ownership lookup, the TTL sweep, and above all
 * the ATOMIC CLAIM — `UPDATE sosRequests SET status='accepted' WHERE id=? AND
 * status='pending'`, winning only when `affectedRows === 1`. This route adds
 * no optimistic check and no second claim path, so SC-003 remains a
 * database-level guarantee.
 *
 * The plaintext `otp` is returned here and ONLY here, to the accepting doctor.
 * It is never persisted and never served by any read route.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Doctor tier only — the same boundary requireDoctor() applies inside the
  // action (a receptionist is never resolved to a linked practice owner).
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
    "This emergency request is not assigned to you.": 403,
    "This emergency request is no longer available.": 409,
    "This emergency request has expired.": 409,
    "Emergency request not found.": 404,
    // Lost the atomic claim — a different doctor won the same DB row.
    "Another doctor accepted this request first.": 409,
  };

  try {
    const result = await acceptSos(requestId);
    if (result.error) return apiError(result.error, statusFor[result.error] ?? 400);
    return NextResponse.json({
      error: null,
      otp: result.otp,
      etaMinutes: result.etaMinutes,
    });
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
