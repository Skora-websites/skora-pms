import { NextResponse } from "next/server";
import { verifySosOtp } from "@/lib/dispatch/actions";
import { requireApiRole } from "@/lib/auth/guard";
import { apiError, csrfGuard, redirectError } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * POST /api/mobile/emergency/requests/{id}/verify-otp — doctor confirms identity.
 *
 * Thin adapter over `verifySosOtp`, which owns the 6-digit regex, the sha256
 * digest and the `crypto.timingSafeEqual` comparison. Only the sha256 digest
 * is ever stored, and the plaintext only ever leaves the service inside
 * acceptSos's response — this route neither persists nor re-serves it.
 *
 * A missing or wrongly-typed `otp` is passed to the action as an empty string
 * so the action's own "Enter the 6-digit code." message is the one the client
 * shows, rather than copy invented here.
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid input.", 400);
  }
  const raw = (body ?? {}) as Record<string, unknown>;
  const otp = typeof raw.otp === "string" ? raw.otp : "";

  const statusFor: Record<string, number> = {
    "Enter the 6-digit code.": 400,
    "No arrival code for this case.": 404,
    "Incorrect code.": 403,
  };

  try {
    const result = await verifySosOtp(requestId, otp);
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
