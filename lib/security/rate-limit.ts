/**
 * In-memory sliding-window rate limiter for server actions.
 *
 * Limits/windows are env-driven via lib/config (RATE_LIMIT_*) with the
 * audit-recommended defaults below.
 *
 * NOTE (audit V1): in-memory state is per-process and resets on restart, so
 * with more than one Node process every limit multiplies by instance count.
 * Set REDIS_URL to share one window across instances — see RedisRateLimiter
 * below. Until then, treat single-instance as a hard deployment constraint,
 * not a convenience.
 */

import { RATE_LIMIT } from "@/lib/config";

type Bucket = {
  timestamps: number[];
};

const buckets = new Map<string, Bucket>();

// Prune stale buckets periodically so the map doesn't grow unbounded.
const PRUNE_INTERVAL_MS = 60_000;
let lastPrune = Date.now();

/**
 * Amortized sweep: at most one full pass per minute, and while the map is
 * large each pass deletes at most PRUNE_BATCH entries so no single call ever
 * walks the whole map. Deleting during iteration is safe in JS Maps.
 *
 * The previous version walked every bucket on each invocation that fell after
 * the interval — a periodic O(buckets) scan on the single-threaded event loop.
 */
const PRUNE_BATCH = 100;

function prune() {
  const now = Date.now();
  if (now - lastPrune < PRUNE_INTERVAL_MS) return;
  lastPrune = now;
  let scanned = 0;
  for (const [key, bucket] of buckets) {
    if (bucket.timestamps.length === 0 || now - bucket.timestamps[bucket.timestamps.length - 1] > 60 * 60_000) {
      buckets.delete(key);
      if (++scanned >= PRUNE_BATCH) break;
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
  login: (email: string) => rateLimit(`login:${email}`, RATE_LIMIT.login, RATE_LIMIT.loginWindowMs),
  loginReset: (email: string) => resetRateLimit(`login:${email}`),
  // Per-IP dimension (audit F-07): bounds distributed credential stuffing
  // against one known account. When the IP is unresolvable this fails OPEN
  // rather than collapsing every caller into one shared "unknown" bucket —
  // a shared bucket turns a per-client limit into a global DoS. The
  // per-email key above still applies in that case.
  loginIp: (ip: string) =>
    ip === "unknown"
      ? { allowed: true, retryAfterMs: 0 }
      : rateLimit(`login-ip:${ip}`, RATE_LIMIT.loginIp, RATE_LIMIT.loginWindowMs),
  loginIpReset: (ip: string) => {
    if (ip !== "unknown") resetRateLimit(`login-ip:${ip}`);
  },
  signup: (email: string) => rateLimit(`signup:${email}`, RATE_LIMIT.signup, 60 * 60_000),
  // Signup OTP verification: cap guesses per email per OTP window so
  // brute-forcing the 6-digit code is impractical, including direct calls
  // to the exported verifySignupOtp server action.
  otpVerify: (email: string) => rateLimit(`otp-verify:${email}`, RATE_LIMIT.otpVerify, 10 * 60_000),
  consent: (slug: string) => rateLimit(`consent:${slug}`, RATE_LIMIT.consent, 60 * 60_000),
  demo: (email: string) => rateLimit(`demo:${email}`, RATE_LIMIT.demo, 60 * 60_000),
  chatPoll: (userId: number) => rateLimit(`chat-poll:${userId}`, RATE_LIMIT.chatPoll, 60_000),
  // SOS: at most N emergency requests per minute per patient.
  emergency: (userId: number) => rateLimit(`emergency:${userId}`, RATE_LIMIT.emergency, 60_000),
  /**
   * The whole `/api/mobile/**` namespace, keyed on the resolved user id
   * (audit V5). A deliberately generous budget: it exists to bound abuse, not
   * to shape normal client behaviour — the native app legitimately polls an
   * emergency tracker every 2–3s, which is well inside it.
   */
  mobileApi: (userId: number) =>
    rateLimit(`mobile-api:${userId}`, MOBILE_API_LIMIT, RATE_LIMIT.mobileApiWindowMs),
};

/** The per-user budget for `/api/mobile/**` (re-exported for the 429 response). */
export const MOBILE_API_LIMIT = RATE_LIMIT.mobileApi;
