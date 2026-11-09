import "server-only";

import { APP_URL } from "@/lib/config";

/**
 * Origin validation for cookie-authenticated route handlers (audit V4).
 *
 * Next.js Server Actions carry their own framework origin check, but the
 * `/api/**` handlers are plain endpoints authenticated by the session cookie,
 * and `sameSite: "lax"` blocks cross-site POSTs WITHOUT blocking same-site
 * ones. So a page on any subdomain (or any future host added to the site)
 * could drive a state change on a signed-in user's behalf.
 *
 * Checking `Origin` — when the header is present — closes that. Browsers set
 * Origin on every cross-origin request and on same-origin POSTs from a page,
 * so a value that matches our own app is proof the request came from our UI.
 *
 * FAIL-CLOSED ON MISMATCH, OPEN ONLY ON ABSENCE: a browser that omits Origin
 * entirely (a direct curl, a webhook relay, or a non-browser client such as
 * the native app's own fetches) is NOT rejected here — those callers are
 * legitimate and cannot be CSRF'd by definition, because a CSRF attack
 * requires a browser to send the request with the victim's cookies. Rejecting
 * on absence would lock out every non-browser client without buying any
 * protection. Real CSRF protection for those routes lives in the fact that
 * they require a session cookie the attacker cannot make a browser attach to
 * a foreign origin.
 */

/** Host names we will accept an `Origin` from, in lower case. */
function allowedOrigins(): Set<string> {
  const origins = new Set<string>();
  const add = (raw: string) => {
    try {
      origins.add(new URL(raw).host.toLowerCase());
    } catch {
      /* a malformed configured value cannot be matched, and adds nothing */
    }
  };
  add(APP_URL);
  // Same-origin requests report the URL without a scheme change; APP_URL is
  // enough in practice, but a configured value of "localhost:3000" without a
  // scheme would otherwise be unmatchable.
  if (process.env.NODE_ENV === "development") {
    origins.add("localhost:3000");
    origins.add("127.0.0.1:3000");
  }
  return origins;
}

/**
 * True when the request's `Origin` is absent or belongs to this app.
 *
 * Returns a descriptive string instead of a bare boolean so callers can log
 * what was rejected.
 */
export function checkSameOrigin(request: Request): { ok: true } | { ok: false; origin: string } {
  const origin = request.headers.get("origin");
  if (!origin) return { ok: true }; // no browser origin to validate

  let host: string;
  try {
    host = new URL(origin).host.toLowerCase();
  } catch {
    return { ok: false, origin };
  }
  return allowedOrigins().has(host) ? { ok: true } : { ok: false, origin };
}

/**
 * Guard for a state-changing route handler. Returns a 403 Response when the
 * request's Origin is foreign, or null when the caller should proceed.
 */
export function rejectForeignOrigin(request: Request): Response | null {
  const result = checkSameOrigin(request);
  if (result.ok) return null;
  return new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}
