import "dotenv/config";

import test from "node:test";
import assert from "node:assert/strict";
import { checkSameOrigin, rejectForeignOrigin } from "../csrf";

/** A request carrying the given Origin (or none). */
function req(origin: string | null) {
  const headers = new Headers();
  if (origin) headers.set("origin", origin);
  return new Request("https://example.test/api/x", { method: "POST", headers });
}

test("a request with no Origin header is allowed — native clients cannot be CSRF'd", () => {
  const r = checkSameOrigin(req(null));
  assert.equal(r.ok, true);
  assert.equal(rejectForeignOrigin(req(null)), null);
});

test("our own configured app origin is allowed", async () => {
  // APP_URL comes from the environment the suite runs in.
  const { APP_URL } = await import("@/lib/config");
  const host = new URL(APP_URL).host;
  const r = checkSameOrigin(req(`https://${host}`));
  assert.equal(r.ok, true, `configured APP_URL host ${host} should be allowed`);
  assert.equal(r.ok, true);
});

test("a foreign origin is refused", () => {
  const r = checkSameOrigin(req("https://evil.example.com"));
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.origin, "https://evil.example.com");

  const res = rejectForeignOrigin(req("https://evil.example.com"));
  assert.ok(res instanceof Response);
  assert.equal(res?.status, 403);
});

test("host comparison is case-insensitive and ignores the scheme mismatch", () => {
  const { APP_URL } = require("@/lib/config") as { APP_URL: string };
  const host = new URL(APP_URL).host.toLowerCase();
  assert.equal(checkSameOrigin(req(`http://${host.toUpperCase()}`)).ok, true);
});

test("a malformed Origin value is refused, not silently allowed", () => {
  assert.equal(checkSameOrigin(req("not-a-url")).ok, false);
  assert.equal(rejectForeignOrigin(req("not-a-url"))?.status, 403);
});

test("a same-host origin on a different port is refused", () => {
  // The host string includes the port, so localhost:9999 ≠ localhost:3000.
  const r = checkSameOrigin(req("https://localhost:9999"));
  if (new URL("https://localhost:9999").host === new URL("http://localhost:3000").host) {
    assert.equal(r.ok, true); // only when the env happens to be that host
  } else {
    assert.equal(r.ok, false);
  }
});
