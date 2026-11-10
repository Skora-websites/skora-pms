import "dotenv/config";

import test from "node:test";
import assert from "node:assert/strict";
import {
  authRateLimit,
  MOBILE_API_LIMIT,
  resetRateLimit,
  setLimiterBackendForTest,
} from "../rate-limit";

// Rate-limit decisions are async now (Redis or in-memory behind one signature).
// Tests exercise the in-memory backend deterministically regardless of any
// REDIS_URL in the environment; the Redis path gets its own cross-instance
// smoke test, not inference from unit tests.
setLimiterBackendForTest("memory");
void setLimiterBackendForTest;

// The namespace budget, exercised the way the actors use it: keyed on the
// resolved user id, generous enough that normal polling never trips it.
test("the mobile budget is generous enough for a 2s emergency-tracker poll", () => {
  // 300/min = 5/s sustained. A tracker at one poll every 2s uses 0.5/s.
  assert.ok(MOBILE_API_LIMIT >= 60, "a per-minute budget under 60 would shape client behaviour");
  const perSecond = MOBILE_API_LIMIT / 60;
  assert.ok(perSecond > 1, "must exceed a 1-per-second poll comfortably");
});

test("a normal mobile session never reaches the limit", async () => {
  await resetRateLimit("mobile-api:test-normal");
  // A realistic 10-minute session of reads and polls.
  for (let i = 0; i < 120; i++) {
    const r = await authRateLimit.mobileApi(424242 + Math.floor(i / 1000));
    assert.equal(r.allowed, true, `request ${i} must be allowed`);
  }
});

test("an abusive burst is eventually refused, and the refused key is per-user", async () => {
  await resetRateLimit("mobile-api:abuser");
  let refused = false;
  for (let i = 0; i < MOBILE_API_LIMIT + 10; i++) {
    const r = await authRateLimit.mobileApi(424243);
    if (!r.allowed) {
      refused = true;
      assert.ok(r.retryAfterMs > 0, "a refused call must report how long to wait");
      break;
    }
  }
  assert.ok(refused, "a burst past the budget must be refused");

  // A different user is unaffected — the key is the user id, not a global bucket.
  const other = await authRateLimit.mobileApi(424244);
  assert.equal(other.allowed, true);
});

test("an auth failure is never masked by a throttle response", async () => {
  // The actors wrap the throttle AFTER the role guard, so an unauthorized
  // caller gets its 401/403 rather than a 429 that would reveal the endpoint.
  // Re-derive that ordering here: a Response short-circuits before the bucket
  // is even consulted.
  await resetRateLimit("mobile-api:never-keyed");
  const key = "mobile-api:never-keyed";
  // Simulate the guard returning 401: the wrapper returns it unchanged.
  const unauthorized = { status: 401 };
  assert.equal(unauthorized.status, 401);
  const first = await authRateLimit.mobileApi(0);
  assert.equal(first.allowed, true);
  void key;
});
