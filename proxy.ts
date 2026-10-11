/**
 * Proxy (Next.js 16 middleware — Node.js runtime) — the outer security net.
 *
 * 1. Session gate: every dashboard prefix (/doctor, /patient, /admin,
 *    /super-admin, /receptionist) requires a valid session cookie JWT
 *    (signature + expiry verified here; revocation checked in the layouts
 *    against the sessions table). Unauthenticated requests are redirected
 *    to /login before any page code runs. API routes verify their own auth
 *    (session or bearer token) inside each handler — see the Next.js
 *    guidance: proxy is a second net, never the only one.
 * 2. Receptionist URL-space rewrite (/receptionist/* → /doctor/*).
 * 3. Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options,
 *    Referrer-Policy, Permissions-Policy, Cache-Control.
 *
 * NOTE: CSP script-src is nonce-locked in production (audit F-08) and
 * relaxed for dev (React Refresh needs 'unsafe-eval'). app/layout.tsx must
 * keep `export const dynamic = "force-dynamic"` — static pages cannot carry
 * the per-request nonce and their bootstrap scripts would be blocked.
 *
 * Client-IP resolution for server actions lives in `lib/security/ip.ts`
 * (server actions cannot read the middleware request directly).
 */

import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// ── CSP directives ──────────────────────────────────────────────────
const isDev = process.env.NODE_ENV === "development";

/**
 * Per-request CSP with a nonce (audit F-08).
 *
 * 'unsafe-inline' previously shipped in PRODUCTION script-src — it sat
 * outside the isDev ternary, so CSP provided no mitigation against XSS at
 * all. Production now uses the nonce mechanism from the Next.js CSP guide
 * (node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md):
 *
 *   1. the proxy generates a fresh nonce per request and sets the CSP on
 *      BOTH the request headers (so Next.js extracts the nonce and applies
 *      it to its own bootstrap + flight scripts) and the response;
 *   2. pages must render DYNAMICALLY — forced app-wide via
 *      `export const dynamic = "force-dynamic"` in app/layout.tsx — because
 *      statically generated pages are built without a request and cannot
 *      carry the nonce;
 *   3. 'strict-dynamic' lets the nonced bootstrap load the route bundles and
 *      covers runtime-injected third-party scripts (the Razorpay checkout
 *      script is document-injected from app JS, which strict-dynamic allows).
 *
 * style-src deliberately keeps 'unsafe-inline' in production: React renders
 * style={{...}} props as style ATTRIBUTES, and attributes cannot be nonced —
 * a strict style-src breaks every dynamic layout (maps, progress bars).
 * Style injection is not script execution; the XSS-relevant directive is
 * script-src, which is now nonce-locked.
 */
function buildCsp(nonce: string): string {
  return [
    // Default: only own origin
    `default-src 'self'`,
    // Scripts — dev additionally needs 'unsafe-eval' (React Refresh) and
    // 'unsafe-inline' (dev overlay); production allows only nonce'd scripts.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${
      isDev ? " 'unsafe-eval' 'unsafe-inline'" : ""
    }`,
    // Styles — React style attributes require 'unsafe-inline' (see above).
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    // Fonts
    `font-src 'self' https://fonts.gstatic.com`,
    // Images (Leaflet tiles + user uploads are https:)
    `img-src 'self' data: blob: https:`,
    // Connect (API calls, WebSocket for dev overlay). Dev also allows the
    // local agent-toolbar port (4747) so its session-sync probes aren't
    // CSP-blocked in the console. Production stays 'self'-only.
    `connect-src 'self'${isDev ? " ws://localhost:* http://localhost:4747 http://127.0.0.1:4747" : ""}`,
    // Frames
    `frame-src 'self'`,
    // Media
    `media-src 'self'`,
    // Workers
    `worker-src 'self' blob:`,
    // Plugin content has no legitimate use — hard-deny.
    `object-src 'none'`,
    // Redundant with X-Frame-Options: DENY, but correct as defence-in-depth.
    `frame-ancestors 'none'`,
    // Prevent inline event handlers / JS URLs
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join("; ");
}

// ── Session gate ──────────────────────────────────────────────────────
// Dashboard URL prefixes that require an authenticated session.
const PROTECTED_PREFIXES = ["/doctor", "/patient", "/admin", "/super-admin", "/receptionist"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

async function hasValidSessionJwt(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get("skora_session")?.value;
  if (!token) return false;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

// ── Proxy ────────────────────────────────────────────────────────────
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Second net: bounce unauthenticated dashboard requests to /login before
  // any layout/page code runs. The layouts + server actions remain the
  // primary authz layer (role checks, revocation, ownership scoping).
  if (isProtectedPath(pathname) && !(await hasValidSessionJwt(request))) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Fresh nonce per request (audit F-08): the CSP travels on the REQUEST
  // headers so Next.js extracts it during SSR and nonces its own inline
  // scripts, and on the RESPONSE so the browser enforces it.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const cspDirectives = buildCsp(nonce);

  // Expose the path (and query) to server components. Layouts can't call
  // usePathname(), so this header lets the doctor/admin layouts enforce
  // permissions server-side and rebuild redirects without losing
  // query strings (e.g. the booking page's ?patient=<id> preselect).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname + request.nextUrl.search);
  requestHeaders.set("Content-Security-Policy", cspDirectives);

  // Receptionist panel URL-space: /receptionist/* renders the /doctor/*
  // routes (the app internals stay on /doctor; the doctor layout bounces
  // receptionist sessions from /doctor/* to /receptionist/* so the browser
  // always shows their own panel prefix).
  let response: NextResponse;
  if (pathname === "/receptionist" || pathname.startsWith("/receptionist/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/receptionist/, "/doctor");
    response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }

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
  // Nonce-locked script-src in production (see buildCsp above).
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