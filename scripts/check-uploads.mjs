// Runnable check for the publicUploadUrl path guard (node scripts/check-uploads.mjs).
// ponytail: swap for a real test runner if the repo ever adopts one.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Mirror the exact regex from lib/utils/uploads.ts and assert the file still
// matches it, so a drifted regex fails here instead of silently.
const src = readFileSync(new URL("../lib/utils/uploads.ts", import.meta.url), "utf8");
const m = src.match(/STORAGE_PREFIX = (\/.+\/);/);
assert.ok(m, "STORAGE_PREFIX regex not found in lib/utils/uploads.ts");
const STORAGE_PREFIX = new RegExp(m[1].slice(1, -1));
const url = (p) => {
  if (!p) return null;
  const normalized = p.replace(/^uploads\//, "");
  return STORAGE_PREFIX.test(normalized) ? `/api/public/file/${normalized}` : null;
};

assert.equal(url(null), null);
assert.equal(url(undefined), null);
assert.equal(url(""), null);
// Seeded legacy static paths must NOT resolve — they never existed here.
assert.equal(url("front-assets/img/banner1.png"), null);
assert.equal(url("/landing/x.png"), null); // leading slash = not a storage path
assert.equal(url("landing/../../../etc/passwd"), null);
assert.equal(url("landing/../../lib/db/index.ts"), null);
assert.equal(url("landing/ok.png"), "/api/public/file/landing/ok.png");
assert.equal(url("landing/uuid-1.webp"), "/api/public/file/landing/uuid-1.webp");
assert.equal(url("blogs/a.b.gif"), "/api/public/file/blogs/a.b.gif");
assert.equal(url("uploads/blogs/a.jpg"), "/api/public/file/blogs/a.jpg");
assert.equal(url("clinic/steal.png"), null); // non-public dir
assert.equal(url("landing/ok.svg"), null); // svg not served
assert.equal(url("landing/ok.jpg%3Fevil"), null); // URL-encoded traversal attempt
console.log("check-uploads: all assertions passed");
