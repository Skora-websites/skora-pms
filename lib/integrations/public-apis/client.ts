import "server-only";
import {
  PUBLIC_API_CONTACT,
  PUBLIC_API_ENABLED,
  PUBLIC_API_TIMEOUT_MS,
} from "@/lib/config";

/** Contact User-Agent required by Nominatim/Open-Meteo usage policies. */
export function publicApiUserAgent(): string {
  return `SkoraCares-ClinicOS/1.0 (contact: ${PUBLIC_API_CONTACT})`;
}

export class PublicApiDisabledError extends Error {
  constructor() {
    super("Public API integrations are disabled");
    this.name = "PublicApiDisabledError";
  }
}

export class PublicApiUpstreamError extends Error {
  source: string;
  status: number;
  constructor(source: string, status: number, message: string) {
    super(`[${source}] upstream ${status}: ${message}`);
    this.name = "PublicApiUpstreamError";
    this.source = source;
    this.status = status;
  }
}

/**
 * Guard: throw when the global or domain flag is off so callers can fall
 * back to current behavior. Callers should catch and degrade gracefully —
 * external enrichment must never block booking/billing/consult flows.
 */
export function assertPublicApiEnabled(domainEnabled = true): void {
  if (!PUBLIC_API_ENABLED || !domainEnabled) throw new PublicApiDisabledError();
}

/** Fetch JSON with timeout + contact UA. Throws PublicApiUpstreamError on !ok. */
export async function fetchPublicJson<T>(
  source: string,
  url: string,
  opts: { timeoutMs?: number; headers?: Record<string, string> } = {}
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? PUBLIC_API_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": publicApiUserAgent(),
        ...(opts.headers ?? {}),
      },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new PublicApiUpstreamError(source, res.status, res.statusText);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof PublicApiUpstreamError) throw err;
    const message = err instanceof Error ? err.message : "fetch failed";
    throw new PublicApiUpstreamError(source, 0, message);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * PHI guard: refuse to send likely-identifying free text to third parties.
 * Reference search etc. must only receive short clinical-topic queries.
 */
export function containsLikelyPhi(text: string): boolean {
  const digits = (text.match(/\d/g) ?? []).length;
  if (digits >= 6) return true;
  if (/\+?\d[\d\s\-().]{9,}/.test(text)) return true;
  if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text)) return true;
  return false;
}
