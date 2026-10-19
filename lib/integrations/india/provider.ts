/**
 * Provider resolution: live India API when configured, committed dataset by
 * default.
 *
 * Live mode is opt-in only: set INDIA_API_BASE_URL (see lib/config.ts) —
 * a NAMASTE/FHIR gateway or an authenticated mirror — and every search
 * proxies to `{base}/india/{kind}?q=…` instead of the snapshot. The
 * expected live response is `{ "items": [ …IndiaItem-shaped… ] }` (a bare
 * array is accepted too); items are parsed through the same boundary
 * schema as the dataset provider, so a malformed upstream row is dropped
 * rather than trusted.
 */

import { INDIA_API_BASE_URL, INDIA_API_KEY, INDIA_API_TIMEOUT_MS, INDIA_API_ENABLED } from "@/lib/config";
import { z } from "zod";
import type { IndiaItem, IndiaKind } from "./types";

export class IndiaDisabledError extends Error {
  constructor() {
    super("Indian clinical data is disabled");
    this.name = "IndiaDisabledError";
  }
}

export class IndiaUpstreamError extends Error {
  source: string;
  status: number;
  constructor(source: string, status: number, message: string) {
    super(`[${source}] upstream ${status}: ${message}`);
    this.name = "IndiaUpstreamError";
    this.source = source;
    this.status = status;
  }
}

/** Same boundary schema as the dataset loader — a live provider's rows are
 *  untrusted input and get the same validation. */
const ItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  detail: z.string().optional(),
  code: z.string().nullable().optional(),
  namaste: z.string().nullable().optional(),
  category: z.string().optional(),
  form: z.string().optional(),
  strength: z.string().optional(),
});

const LiveEnvelope = z.union([
  z.object({ items: z.array(z.unknown()) }),
  z.array(z.unknown()),
]);

export function isLiveProvider(): boolean {
  return INDIA_API_ENABLED && INDIA_API_BASE_URL !== null;
}

/** Kill-switch guard — mirrors the public-apis pattern. */
export function assertIndiaEnabled(): void {
  if (!INDIA_API_ENABLED) throw new IndiaDisabledError();
}

/** Fetch one kind from the live provider; throws IndiaUpstreamError on any
 *  non-OK/timeout/malformed outcome. Cached upstreams may report `cached`
 *  via the `X-Cache` response header (best effort). */
export async function fetchLiveItems(kind: IndiaKind, query: string): Promise<{ items: IndiaItem[]; cached: boolean }> {
  const base = INDIA_API_BASE_URL;
  if (!base) throw new IndiaUpstreamError("india", 0, "INDIA_API_BASE_URL is not set");
  const url = `${base.replace(/\/+$/, "")}/india/${kind}?q=${encodeURIComponent(query)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), INDIA_API_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(INDIA_API_KEY ? { Authorization: `Bearer ${INDIA_API_KEY}` } : {}),
      },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new IndiaUpstreamError(kind, res.status, res.statusText);
    }
    const envelope = LiveEnvelope.safeParse(await res.json());
    if (!envelope.success) {
      throw new IndiaUpstreamError(kind, 0, "malformed live response");
    }
    const raw = Array.isArray(envelope.data) ? envelope.data : envelope.data.items;
    const items = raw.flatMap((row) => {
      const parsed = ItemSchema.safeParse(row);
      return parsed.success ? [parsed.data] : [];
    });
    return { items, cached: res.headers.get("x-cache") === "hit" };
  } catch (err) {
    if (err instanceof IndiaUpstreamError) throw err;
    const message = err instanceof Error ? err.message : "fetch failed";
    throw new IndiaUpstreamError(kind, 0, message);
  } finally {
    clearTimeout(timer);
  }
}
