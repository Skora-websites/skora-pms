import { NextResponse } from "next/server";
import { rateSosCase } from "@/lib/dispatch/actions";
import { requireApiRole } from "@/lib/auth/guard";
import { apiError, redirectError } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * POST /api/mobile/emergency/requests/{id}/rating — patient rates the visit.
 *
 * Thin adapter over `rateSosCase`, which owns the rating schema
 * (`rating` integer 1..5, `note` ≤ 500), the case lookup by
 * `(sosRequestId, patientId = caller)`, the completed-only rule and the
 * one-rating-per-case rule (FR-016).
 */
export async function POST(
  request: Request,
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid input.", 400);
  }
  const raw = (body ?? {}) as Record<string, unknown>;
  // rating is coerced by the action's schema exactly as the form path is, so a
  // missing or non-numeric rating lands on the schema's own message; an absent
  // note stays optional (never null, which the schema would reject).
  const rating = raw.rating == null ? Number.NaN : Number(raw.rating);
  if (!Number.isFinite(rating)) return apiError("Invalid input.", 400);
  const note = typeof raw.note === "string" ? raw.note : "";

  const statusFor: Record<string, number> = {
    "Case not found.": 404,
    "This visit is not completed yet.": 409,
    "You already rated this visit.": 409,
  };

  try {
    const result = await rateSosCase(requestId, rating, note);
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
