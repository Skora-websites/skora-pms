/**
 * Sliding-window rate limiter for server actions (audit V1/V12, R6).
 *
 * Limits/windows are env-driven via lib/config (RATE_LIMIT_*) with the
 * audit-recommended defaults below.
 *
 * TWO BACKENDS, ONE SIGNATURE:
 *  - Without REDIS_URL: per-process in-memory windows — correct for the
 *    documented single-instance deployment; state resets on restart.
 *  - With REDIS_URL: ONE shared window across instances, backed by a Lua
 *    sliding-window script on Redis (atomic: prune → insert → count → key
 *    TTL in one round trip). `rateLimit` returns a PROMISE in both modes;
 *    awaiting the in-memory result is free, so call sites are identical.
 *
 * The Redis path FAILS OPEN on connection trouble — same policy as every
 * preference-lookup failure in the auth flows: a limiter outage may allow
 * extra requests, but must never take an emergency dispatch or a login down.
 */

import { RATE_LIMIT } from "@/lib/config";
import { redisClient } from "@/lib/redis";

export type RateDecision = { allowed: boolean; retryAfterMs: number };

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

/**
 * The shared-window script. Returns [allowed(0/1), retryAfterMs].
 * KEYS[1]=window key; ARGV[1]=now(ms), ARGV[2]=window(ms), ARGV[3]=limit,
 * ARGV[4]=key TTL(ms). Sliding window = member scores are timestamps.
 */
const SLIDING_WINDOW_LUA = `
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local ttl = tonumber(ARGV[4])
local key = KEYS[1]
redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
local count = redis.call('ZCARD', key)
if count >= limit then
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  local oldestTs = tonumber(oldest[2]) or now
  return {0, math.max(0, window - (now - oldestTs))}
end
redis.call('ZADD', key, now, ARGV[1] .. ':' .. tostring(math.random()))
redis.call('PEXPIRE', key, ttl)
return {1, 0}
`;

/** False determinism guard: two identical-ms calls would collide as members. */
let memberSeq = 0;

async function redisRateLimit(key: string, limit: number, windowMs: number): Promise<RateDecision | null> {
  const client = redisClient();
  if (!client) return null;
  try {
    const now = Date.now();
    memberSeq = (memberSeq + 1) % 1_000_000;
    const result = (await client.eval(
      SLIDING_WINDOW_LUA,
      1,
      `rl:${key}`,
      String(now),
      String(windowMs),
      String(limit),
      String(Math.ceil(windowMs * 1.2)),
      `${now}:${process.pid}:${memberSeq}`
    )) as [number, number];
    return { allowed: result[0] === 1, retryAfterMs: Number(result[1]) };
  } catch {
    // Fail OPEN — the caller's request proceeds; the outage is logged once
    // by the shared client's error handler.
    return null;
  }
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateDecision> {
  prune();

  // Shared windows win when Redis is configured AND reachable; the in-memory
  // path is the single-instance default AND the outage fallback.
  if (limiterBackendOverride !== "memory") {
    const shared = await redisRateLimit(key, limit, windowMs);
    if (shared) return shared;
  }

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
export async function resetRateLimit(key: string): Promise<void> {
  prune();
  const client = redisClient();
  if (client) {
    try {
      await client.del(`rl:${key}`);
    } catch {
      // Reset is best-effort; the local bucket is cleared regardless.
    }
  }
  buckets.delete(key);
}

/** Force in-memory behaviour in tests, regardless of REDIS_URL (per test-file). */
export function setLimiterBackendForTest(backend: "memory" | "auto"): void {
  limiterBackendOverride = backend;
}
let limiterBackendOverride: "memory" | "auto" = "auto";

/** The one decision shape, resolved for the fail-open branches. */
function allowedDecision(): RateDecision {
  return { allowed: true, retryAfterMs: 0 };
}

/** Dedicated helpers for common auth actions. All return PROMISES. */
export const authRateLimit = {
  login: (email: string) => rateLimit(`login:${email}`, RATE_LIMIT.login, RATE_LIMIT.loginWindowMs),
  loginReset: (email: string) => resetRateLimit(`login:${email}`),
  // Per-IP dimension (audit F-07): bounds distributed credential stuffing
  // against one known account. When the IP is unresolvable this fails OPEN
  // rather than collapsing every caller into one shared "unknown" bucket —
  // a shared bucket turns a per-client limit into a global DoS. The
  // per-email key above still applies in that case.
  loginIp: async (ip: string): Promise<RateDecision> =>
    ip === "unknown"
      ? allowedDecision()
      : rateLimit(`login-ip:${ip}`, RATE_LIMIT.loginIp, RATE_LIMIT.loginWindowMs),
  loginIpReset: (ip: string): Promise<void> => {
    if (ip === "unknown") return Promise.resolve();
    return resetRateLimit(`login-ip:${ip}`);
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
  // Vendor lab-report upload (audit V5): the endpoint is token-gated, not
  // session-gated, so the token holder is the only identity — but the token
  // leaks nothing about who holds it, so bound the WRITE rate per client IP.
  // Like loginIp, an unresolvable IP fails OPEN: collapsing every caller into
  // one shared "unknown" bucket would turn a per-client limit into a global
  // DoS on the upload path.
  vendorUploadIp: (ip: string): Promise<RateDecision> =>
    ip === "unknown"
      ? Promise.resolve(allowedDecision())
      : rateLimit(`vendor-upload-ip:${ip}`, RATE_LIMIT.vendorUploadIp, 60 * 60_000),
  /**
   * Guard-level budget (audit V12): applied INSIDE requireApiRole, so every
   * route that resolves a user through the shared guards is throttled without
   * each route having to remember. Keyed on the resolved user id (identity,
   * not IP — clients share NAT). Deliberately the same generous default as
   * the mobile namespace budget: it bounds abuse, it does not shape normal
   * client behaviour. Mobile routes additionally count in their own
   * `mobile-api` bucket; two independent generous budgets bind at the same
   * effective rate, neither halves the other.
   */
  apiGuard: (userId: number) =>
    rateLimit(`api-guard:${userId}`, RATE_LIMIT.apiGuard, RATE_LIMIT.apiGuardWindowMs),
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
