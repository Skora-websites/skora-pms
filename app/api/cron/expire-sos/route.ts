import { NextRequest, NextResponse } from "next/server";
import { expireStalePendingRequests } from "@/lib/dispatch/expiry";
import { resolveApiTokenHeader, touchApiToken } from "@/lib/auth/api-token";
import { rateLimit } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/ip";

export const runtime = "nodejs";

/**
 * Scheduled SOS expiry sweep.
 *
 * GET /api/cron/expire-sos
 *   Headers: Authorization: Bearer <token>   (provisioned via
 *            scripts/provision-api-token.mjs)
 *
 * Inline expiry only runs when somebody reads or claims a request, so a patient
 * who closed the tab or lost signal leaves a pending request no code path ever
 * touches. This endpoint drives the same TTL rule over the whole table on a
 * cron, so stale requests end, their doctor offers close, and the patient's
 * status poll stops showing a dispatch that can never complete.
 *
 * Machine-to-machine like the Shule integration: no session, a bearer token,
 * a per-client rate limit, and only maintenance work behind it — it never
 * exposes or mutates clinical data beyond flipping expired statuses.
 *
 * aaPanel cron (every minute):
 *   curl -s -H "Authorization: Bearer <token>" \
 *     https://pms.skorainfotech.com/api/cron/expire-sos
 */

// The sweep is cheap and runs at most once a minute; 5 req/min leaves room for
// a misconfigured double-cron without letting it hammer the database.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

export async function GET(request: NextRequest) {
  const ip = await getClientIp();
  const authHeader = request.headers.get("authorization");
  const clientKey =
    ip !== "unknown" ? `ip:${ip}` : `token:${authHeader ? authHeader.slice(-16) : "anonymous"}`;
  const { allowed } = rateLimit(`cron-expire-sos:${clientKey}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const resolution = await resolveApiTokenHeader(authHeader);
  if (resolution.kind === "deactivated") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (resolution.kind !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  void touchApiToken(authHeader);

  const expired = await expireStalePendingRequests();

  return NextResponse.json(
    { data: { expiredRequests: expired } },
    { headers: { "Cache-Control": "no-store" } }
  );
}
