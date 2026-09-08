/**
 * In-memory sliding-window rate limiter for server actions.
 *
 * NOTE: In-memory state is per-process and resets on restart. For production
 * with multiple instances, swap this for a Redis-backed limiter (same API).
 */

type Bucket = {
  timestamps: number[];
};

const buckets = new Map<string, Bucket>();

// Prune stale buckets periodically so the map doesn't grow unbounded.
const PRUNE_INTERVAL_MS = 60_000;
let lastPrune = Date.now();

function prune() {
  const now = Date.now();
  if (now - lastPrune < PRUNE_INTERVAL_MS) return;
  lastPrune = now;
  for (const [key, bucket] of buckets) {
    if (bucket.timestamps.length === 0 || now - bucket.timestamps[bucket.timestamps.length - 1] > 60 * 60_000) {
      buckets.delete(key);
    }
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number } {
  prune();

  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(key, bucket);
  }

  // Drop timestamps outside the window.
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0];
    return { allowed: false, retryAfterMs: Math.max(0, windowMs - (now - oldest)) };
  }

  bucket.timestamps.push(now);
  return { allowed: true, retryAfterMs: 0 };
}

/** Forget past attempts for a key — e.g. after a successful login. */
export function resetRateLimit(key: string) {
  prune();
  buckets.delete(key);
}

/** Dedicated helpers for common auth actions. */
export const authRateLimit = {
  login: (email: string) => rateLimit(`login:${email}`, 5, 15 * 60_000),
  loginReset: (email: string) => resetRateLimit(`login:${email}`),
  signup: (email: string) => rateLimit(`signup:${email}`, 3, 60 * 60_000),
  consent: (slug: string) => rateLimit(`consent:${slug}`, 10, 60 * 60_000),
  demo: (email: string) => rateLimit(`demo:${email}`, 5, 60 * 60_000),
  chatPoll: (userId: number) => rateLimit(`chat-poll:${userId}`, 30, 60_000),
  // SOS: at most 1 emergency request per minute per patient.
  emergency: (userId: number) => rateLimit(`emergency:${userId}`, 1, 60_000),
};
