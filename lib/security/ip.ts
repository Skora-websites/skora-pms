/**
 * Client-IP resolution for server actions.
 *
 * Server actions can read request headers via `next/headers`, which is
 * how we obtain the real client IP.  When running behind a reverse proxy
 * (Cloudflare, Nginx, Vercel, etc.) the real IP is in a forwarded header —
 * configure TRUSTED_PROXY_HEADER accordingly.
 *
 * NOTE: `x-forwarded-for` is client-spoofable unless the proxy overwrites
 * it. Only trust it when you control the proxy in front of the app.
 */

import { headers } from "next/headers";

export async function getClientIp(): Promise<string> {
  const h = await headers();

  // Explicitly configured trusted proxy header (e.g. "x-forwarded-for").
  const trusted = process.env.TRUSTED_PROXY_HEADER?.toLowerCase();
  if (trusted) {
    const value = h.get(trusted);
    if (value) {
      // Take the left-most entry (the original client) per RFC 7239.
      return value.split(",")[0]?.trim() || "unknown";
    }
  }

  // Common proxy headers as a fallback.
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";

  const realIp = h.get("x-real-ip");
  if (realIp) return realIp.trim();

  // Direct connection / dev server.
  const cf = h.get("cf-connecting-ip");
  if (cf) return cf.trim();

  return "unknown";
}