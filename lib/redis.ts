import Redis from "ioredis";

import { REDIS_URL } from "@/lib/config";

/**
 * The process-wide Redis client, built lazily from REDIS_URL (audit R6).
 *
 * WHY LAZY: without REDIS_URL the app is deliberately single-instance
 * (documented in lib/config and DEPLOY_AND_MOBILE_PLAN §1.8) and must not
 * pay a connection attempt or even require the driver at import time. The
 * limiter and hub call this at first use:
 *
 *   - unset REDIS_URL  → null, and everything degrades to the in-memory
 *     implementations exactly as before (single-instance is a SUPPORTED
 *     configuration, not a fallback from failure);
 *   - set REDIS_URL    → one shared client per process. Callers get the
 *     plain ioredis instance (commands, pub/sub via duplicate()).
 *
 * Connection failures are the caller's concern — the limiter FAILS OPEN and
 * the hub fails back to in-process delivery, both pre-existing safety rules.
 * This module only logs once instead of spamming the handler's console.
 */
let client: Redis | null = null;
let loggedError = false;

export function redisClient(): Redis | null {
  if (!REDIS_URL) return null;
  if (!client) {
    client = new Redis(REDIS_URL, {
      // Emergency dispatch shares this connection: a network hiccup should
      // retry above; never hang a request longer than a limiter decision may.
      maxRetriesPerRequest: 3,
      connectTimeout: 5_000,
    });
    client.on("error", (err: Error) => {
      if (!loggedError) {
        console.error(`[redis] connection problem (${REDIS_URL}):`, err.message);
        loggedError = true;
      }
    });
    client.on("ready", () => {
      loggedError = false;
    });
  }
  return client;
}

/** Started/failed? — for smoke tests and health surfacing, not the request path. */
export function redisConfigured(): boolean {
  return Boolean(REDIS_URL);
}
