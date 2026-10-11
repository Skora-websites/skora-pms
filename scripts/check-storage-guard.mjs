// Runnable check for the shared path-containment helper (node scripts/check-storage-guard.mjs).
// Mirrors the audit F-13 fix: every file-serving route must contain paths via
// resolveWithinStorage (path.relative), NOT a bare startsWith prefix, and the
// helper itself must reject sibling-directory and traversal escapes.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

// Re-implement the helper's logic against a fake root so the check does not
// depend on process.cwd() (mirrors the implementation in lib/utils/uploads.ts).
function resolveWithin(root, storedPath) {
  const resolved = path.resolve(root, storedPath);
  const rel = path.relative(root, resolved);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return resolved;
}

const root = path.resolve("/tmp/fake-storage/uploads");

// Containment holds for ordinary paths.
assert.equal(resolveWithin(root, "landing/x.png"), path.join(root, "landing/x.png"));
assert.equal(resolveWithin(root, "consent-files/a.pdf"), path.join(root, "consent-files/a.pdf"));
assert.equal(resolveWithin(root, "consent-files/sub/dir/b.jpg"), path.join(root, "consent-files/sub/dir/b.jpg"));

// The bare-prefix escapes that motivated the fix — all must be rejected.
assert.equal(resolveWithin(root, "../uploads-evil/x.png"), null); // sibling directory
assert.equal(resolveWithin(root, "../../etc/passwd"), null);
assert.equal(resolveWithin(root, "landing/../../../etc/passwd"), null);
assert.equal(resolveWithin(root, "/etc/passwd"), null); // absolute input
assert.equal(resolveWithin(root, "./landing/../../secrets.txt"), null);

// No file-serving route may keep the weak primitive.
const appDir = path.resolve(process.cwd(), "app");
const offenders = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.name === "route.ts") {
      const src = readFileSync(full, "utf8");
      if (/\.startsWith\(\s*(STORAGE_DIR|PHOTO_DIR|REPORT_DIR|CONSENT_FILES_DIR|CONSENT_PDFS_DIR)\s*\)/.test(src)) {
        offenders.push(path.relative(process.cwd(), full));
      }
    }
  }
}
walk(appDir);
assert.deepEqual(offenders, [], `bare startsWith containment still present in: ${offenders.join(", ")}`);

console.log("check-storage-guard: all assertions passed");
