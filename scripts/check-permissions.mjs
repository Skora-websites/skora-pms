// Runnable check: every permission name referenced by a route map or the
// manager editor MUST exist as a row in the permissions table.
//
// Audit finding M1: lib/auth/permissions.ts gated /admin/consultations on
// "consultations" and /admin/online-consultations on "online-consultations",
// names that were never seeded — so both routes were only reachable through
// the owner role bypass and could never be granted to a manager.
//
// Runs against the live catalogue like check-db-schema.mjs.
//
//   node scripts/check-permissions.mjs
//
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const ROOT = `${fileURLToPath(new URL("..", import.meta.url))}/`;

function readEnv() {
  return Object.fromEntries(
    readFileSync(`${ROOT}.env`, "utf8")
      .split("\n")
      .filter((l) => l && !l.startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
      })
  );
}

/**
 * Every `perm: "<name>"` entry in a route-map array, EXCLUDING `ownerOnly`
 * entries: those are enforced by `viewerRole`, not by `perms.has()`
 * (see hasAdminModuleAccess), so their names never need a catalog row.
 */
function permsInRouteMap(source) {
  const out = [];
  for (const m of source.matchAll(/perm:\s*"([a-z-]+)"\s*(,\s*ownerOnly:\s*true)?/g)) {
    if (!m[2]) out.push(m[1]);
  }
  return out;
}

/** Every module name in a `as const` delegable array. */
function permsInDelegable(source) {
  return [...source.matchAll(/^\s{4}"([a-z-]+)",?$/gm)].map((m) => m[1]);
}

const permissions = readFileSync(`${ROOT}lib/auth/permissions.ts`, "utf8");
const managerActions = readFileSync(`${ROOT}app/admin/managers/actions.ts`, "utf8");

const routePerms = new Set(permsInRouteMap(permissions));
const delegable = new Set(permsInDelegable(managerActions));
const referenced = [...new Set([...routePerms, ...delegable])].sort();

const conn = await mysql.createConnection(readEnv().DATABASE_URL);
const [rows] = await conn.query("SELECT name FROM permissions");
await conn.end();

const catalog = new Set(rows.map((r) => r.name));
const missing = referenced.filter((name) => !catalog.has(name));

console.log(
  `check-permissions: ${referenced.length} referenced names, ${catalog.size} catalog rows`
);
for (const name of referenced) {
  console.log(`  ${catalog.has(name) ? "✓" : "✗"} ${name}`);
}
assert.deepEqual(
  missing,
  [],
  `route map / manager editor reference permission names that do not exist: ${missing.join(", ")}\n` +
    `Add them to scripts/seed.ts (module map) or a drizzle migration.`
);
console.log("check-permissions: all assertions passed");
