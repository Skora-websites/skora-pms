/**
 * Security headers middleware.
 *
 * Sets security-related HTTP headers on every response:
 *   - CSP, HSTS, X-Frame-Options, X-Content-Type-Options,
 *     Referrer-Policy, Permissions-Policy, Cache-Control
 *
 * NOTE: CSP is intentionally relaxed for dev (inline styles/scripts
 * needed by Next.js React Refresh). Tighten for production builds.
 *
 * Client-IP resolution for server actions lives in `lib/security/ip.ts`
 * (server actions cannot read the middleware request directly).
 */

import { NextResponse, type NextRequest } from "next/server";

// ── CSP directives ──────────────────────────────────────────────────
const isDev = process.env.NODE_ENV === "development";

const cspDirectives = [
  // Default: only own origin + known CDNs
  `default-src 'self'`,
  // Scripts — Next.js needs 'unsafe-inline' + 'unsafe-eval' for
  // the dev overlay and React Refresh.  In production builds the
  // framework generates nonces so these can be removed.
  `script-src 'self' ${
    isDev ? "'unsafe-eval' 'unsafe-inline'" : ""
  } 'unsafe-inline' https://cdn.jsdelivr.net`,
  // Styles — same trade-off for dev.
  `style-src 'self' ${
    isDev ? "'unsafe-inline'" : ""
  } 'unsafe-inline' https://fonts.googleapis.com`,
  // Fonts
  `font-src 'self' https://fonts.gstatic.com`,
  // Images
  `img-src 'self' data: blob: https:`,
  // Connect (API calls, WebSocket for dev overlay)
  `connect-src 'self'${
    isDev ? " ws://localhost:*" : ""
  } https://cdn.jsdelivr.net`,
  // Frames
  `frame-src 'self'`,
  // Media
  `media-src 'self'`,
  // Workers
  `worker-src 'self' blob:`,
  // Prevent inline event handlers / JS URLs
  `base-uri 'self'`,
  `form-action 'self'`,
].filter(Boolean).join("; ");

// ── Middleware ───────────────────────────────────────────────────────
export function proxy(request: NextRequest) {
  // Expose the pathname to server components. Layouts can't call
  // usePathname(), so this header lets the doctor layout enforce
  // permissions server-side (redirect before restricted pages fetch data).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  // Create response with security headers.
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // ── Standard security headers ─────────────────────────────────
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Referrer-Policy",
    "strict-origin-when-cross-origin"
  );
  response.headers.set(
    "Permissions-Policy",
    [
      "camera=()",
      "microphone=()",
      // Geolocation is used by the SOS emergency dispatch (patient +
      // doctor live tracking), so allow it on this origin.
      "geolocation=(self)",
      "interest-cohort=()",
    ].join(", ")
  );
  response.headers.set("X-DNS-Prefetch-Control", "off");

  // ── HSTS (production only) ────────────────────────────────────
  if (!isDev) {
    // max-age=1 year, includeSubDomains, preload
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // ── Content-Security-Policy ────────────────────────────────────
  // In dev we keep a relaxed policy.  In production the policy
  // should be tightened once the app is fully audited for inline
  // styles/scripts (e.g. via nonce or hash).
  response.headers.set("Content-Security-Policy", cspDirectives);

  // ── Cache-Control for dynamic pages ────────────────────────────
  // The middleware applies to all routes; static assets from
  // _next/static already have their own Cache-Control set by Next.js.
  // We only override for HTML responses.
  if (request.nextUrl.pathname.match(/\.(html?|json)$/)) {
    response.headers.set("Cache-Control", "no-store, must-revalidate");
  }

  return response;
}

// ── Matcher ─────────────────────────────────────────────────────────
// Only run on app routes, API routes, and pages (skip _next/static,
// _next/image, favicon.ico, etc.).
export const config = {
  matcher: [
    // Match all request paths except:
    "/((?!_next/static|_next/image|favicon\\.ico|apple-touch-icon.*\\.png|screenshot.*\\.png).*)",
  ],
};