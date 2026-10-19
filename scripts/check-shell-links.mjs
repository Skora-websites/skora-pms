// Runnable check: a component shared between shells MUST NOT hardcode another
// shell's URL prefix.
//
// Audit findings H6-H10: components/dashboard/header.tsx, mobile-app-shell.tsx,
// mobile-view/consultations-list.tsx and components/doctor/appointment-actions.tsx
// all hardcoded `/doctor/*` hrefs while also being rendered inside /admin. An
// owner clicking them hit requireRole(["doctor","receptionist"]) in the doctor
// layout and was silently bounced out of their own panel; test reports 403'd.
//
// The fix is lib/auth/shell-paths.ts (normalizeShell + per-purpose helpers).
// This check is its regression guard: it fails the moment someone reintroduces
// a literal cross-shell href.
//
//   node scripts/check-shell-links.mjs
//
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = `${fileURLToPath(new URL("..", import.meta.url))}/`;

/**
 * Files that legitimately own a shell's URLs: a shell's own LAYOUT/route files
 * and the components only that shell renders. Nothing shared belongs here —
 * that is the whole point of the check.
 */
const ALLOWED_PREFIX_OWNERS = new Set([
  "app/doctor/layout.tsx",
  "app/admin/layout.tsx",
  "app/patient/layout.tsx",
  "app/super-admin/layout.tsx",
]);

/** Every .tsx under a directory, recursively. */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) out.push(full);
  }
  return out;
}

const files = [...walk(`${ROOT}components`), ...walk(`${ROOT}app`)];

/** href="..." or href={`...`} literals that start with a shell prefix. */
const LINK = /(?:href|action)(?:\s*=\s*|=\s*\{`)(["'`])(\/[^"'`]*)\1/g;

const findings = [];
for (const file of files) {
  const rel = file.slice(ROOT.length);
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(LINK)) {
    const target = m[2];
    // A link to another shell's root from a shell that owns that root.
    const isDoctor = target.startsWith("/doctor");
    const isAdmin = target.startsWith("/admin");
    const isPatient = target.startsWith("/patient");
    const isSuperAdmin = target.startsWith("/super-admin");
    const isReceptionist = target.startsWith("/receptionist");
    const owners = [isDoctor && "/doctor", isAdmin && "/admin", isPatient && "/patient", isSuperAdmin && "/super-admin", isReceptionist && "/receptionist"].filter(Boolean);
    if (owners.length === 0) continue;
    // The file's own shell: an app/<shell>/... path may link its own prefix.
    const ownShell = rel.startsWith("app/doctor/") ? "/doctor"
      : rel.startsWith("app/admin/") ? "/admin"
      : rel.startsWith("app/patient/") ? "/patient"
      : rel.startsWith("app/super-admin/") ? "/super-admin"
      : rel.startsWith("app/(marketing)/") || rel.startsWith("app/(auth)/") ? null
      : null;
    for (const owner of owners) {
      if (owner === ownShell) continue; // own shell's own pages
      if (owner === "/doctor" && (rel.startsWith("components/doctor/") || rel.startsWith("components/dashboard/"))) continue; // doctor-shell components default to /doctor; the shell decides
      if (ALLOWED_PREFIX_OWNERS.has(rel)) continue;
      findings.push(`${rel}: href to ${target}`);
    }
  }
}

console.log(`check-shell-links: scanned ${files.length} component/route files`);
for (const f of findings) console.log(`  ✗ ${f}`);
assert.deepEqual(
  findings,
  [],
  "components must not hardcode another shell's URL prefix — use lib/auth/shell-paths.ts\n" +
    "(normalizeShell + notificationsPath/profilePath/consultationDetailPath/…)."
);
console.log("check-shell-links: all assertions passed");
