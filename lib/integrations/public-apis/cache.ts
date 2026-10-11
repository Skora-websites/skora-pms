import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

/**
 * Two-layer cache for no-key public APIs.
 * L1: in-memory Map (per server instance, survives hot reload via globalThis).
 * L2: existing Laravel-compatible `cache` table (key/value/expiration) so
 *     cached holidays/pincodes survive restarts and work across instances.
 * Values are JSON-encoded. Expiration is unix seconds like the legacy table.
 */

type MemEntry = { value: unknown; expiresAtMs: number };
const globalCache = globalThis as unknown as { __pubApiMem?: Map<string, MemEntry> };
function mem(): Map<string, MemEntry> {
  if (!globalCache.__pubApiMem) globalCache.__pubApiMem = new Map();
  return globalCache.__pubApiMem;
}

function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const m = mem().get(key);
  if (m) {
    if (m.expiresAtMs > Date.now()) return m.value as T;
    mem().delete(key);
  }
  try {
    const rows = await db
      .select({ value: schema.cache.value, expiration: schema.cache.expiration })
      .from(schema.cache)
      .where(eq(schema.cache.key, key))
      .limit(1);
    if (rows.length === 0) return null;
    if (rows[0].expiration <= nowSec()) return null;
    const parsed = JSON.parse(rows[0].value) as T;
    mem().set(key, { value: parsed, expiresAtMs: rows[0].expiration * 1000 });
    return parsed;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSec: number): Promise<void> {
  const exp = nowSec() + Math.max(60, ttlSec);
  mem().set(key, { value, expiresAtMs: exp * 1000 });
  try {
    const encoded = JSON.stringify(value);
    await db
      .insert(schema.cache)
      .values({ key, value: encoded, expiration: exp })
      .onDuplicateKeyUpdate({ set: { value: encoded, expiration: exp } });
  } catch {
    // L2 is best-effort; L1 still serves this instance.
  }
}

/** Cache-aside helper: return cached value or run fetcher and store it. */
export async function cached<T>(key: string, ttlSec: number, fetcher: () => Promise<T>): Promise<{ data: T; cached: boolean }> {
  const hit = await cacheGet<T>(key);
  if (hit !== null) return { data: hit, cached: true };
  const data = await fetcher();
  await cacheSet(key, data, ttlSec);
  return { data, cached: false };
}

export function cacheKey(parts: Array<string | number>): string {
  return `pubapi:${parts.map((p) => String(p).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")).join(":")}`;
}
