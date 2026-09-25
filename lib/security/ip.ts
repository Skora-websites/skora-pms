/**
 * Client-IP resolution for server actions.
 *
 * Server actions can read request headers via `next/headers`, which is
 * how we obtain the real client IP.  When running behind a reverse proxy
 * (Cloudflare, Nginx, Vercel, etc.) the real IP is in a forwarded header —
 * configure TRUSTED_PROXY_HEADER accordingly.
 *
 * SECURITY: x-forwarded-for and friends are client-spoofable unless the
 * proxy overwrites them, so headers are only read when TRUSTED_PROXY_HEADER
 * explicitly names a proxy-controlled header. Without that configuration
 * (or when the configured header is absent on a request) this returns
 * "unknown", keeping throttle keys and audit source_ip attacker-proof.
 */

import { headers } from "next/headers";

export async function getClientIp(): Promise<string> {
  const h = await headers();

  // Explicitly configured trusted proxy header (e.g. "x-forwarded-for").
  // Only a proxy-controlled header may be trusted — a direct client can set
  // anything else, so there is deliberately no implicit fallback to common
  // proxy headers.
  const trusted = process.env.TRUSTED_PROXY_HEADER?.toLowerCase();
  if (trusted) {
    const value = h.get(trusted);
    if (value) {
      // Take the left-most entry (the original client) per RFC 7239.
      return value.split(",")[0]?.trim() || "unknown";
    }
  }

  // No trusted proxy header configured (or it was absent on this request).
  // Returning "unknown" keeps per-IP throttle buckets and audit source_ip
  // from being attacker-chosen. Set TRUSTED_PROXY_HEADER when deployed
  // behind a proxy that overwrites the header; a directly exposed server
  // never receives spoofable forwarded headers in the first place.
  return "unknown";
}