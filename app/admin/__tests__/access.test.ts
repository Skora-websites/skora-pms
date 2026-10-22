/**
 * US3 — admin-tier page access is decided in ONE place.
 *
 * Audit D1: /admin nav entries and row actions were gated per page, and the
 * owner-parity modules (/admin/home-visits, /admin/chat, /admin/consultations,
 * ...) were missing from ADMIN_ROUTE_PERMISSIONS, so an owner opening them was
 * bounced. hasAdminModuleAccess is now the single gate: owners pass every
 * route, managers pass only the modules they hold, owner-only modules always
 * fail for managers.
 *
 * This suite pins the route-map half of SC-004 and SC-005: for EVERY entry in
 * ADMIN_ROUTE_PERMISSIONS an owner is admitted, a manager holding the module
 * is admitted, and a manager without it is refused — on the prefix itself and
 * on nested paths under it, because the resolver matches by prefix.
 *
 * The catalog-vs-route-map diff (delegable set, live permission rows, default
 * manager grants) is covered by managers.test.ts in this same directory.
 *
 * Run: npm run test
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { ADMIN_ROUTE_PERMISSIONS, hasAdminModuleAccess } from "@/lib/auth/permissions";

const OWNER = "owner" as const;
const MANAGER = "manager" as const;

/** The three modules an owner must never delegate (audit L2/D1). */
const OWNER_ONLY_PREFIXES = ["/admin/managers", "/admin/clinics", "/admin/settings"];

test("the route map contains exactly the three owner-only modules", () => {
  const actual = ADMIN_ROUTE_PERMISSIONS.filter((entry) => entry.ownerOnly)
    .map((entry) => entry.prefix)
    .sort();
  assert.deepEqual(actual, [...OWNER_ONLY_PREFIXES].sort());
});

test("every route entry names a distinct non-empty prefix and permission", () => {
  const prefixes = ADMIN_ROUTE_PERMISSIONS.map((entry) => entry.prefix);
  assert.equal(new Set(prefixes).size, prefixes.length, "duplicate prefixes collide in the resolver");
  for (const entry of ADMIN_ROUTE_PERMISSIONS) {
    assert.ok(entry.prefix.startsWith("/admin"), `${entry.prefix} is not an admin route`);
    assert.ok(entry.perm.length > 0, `${entry.prefix} carries no permission name`);
  }
});

test("every prefix in the map resolves for an owner, including nested paths", () => {
  for (const entry of ADMIN_ROUTE_PERMISSIONS) {
    assert.equal(
      hasAdminModuleAccess(new Set(), entry.prefix, OWNER),
      true,
      `owner refused ${entry.prefix}`
    );
    assert.equal(
      hasAdminModuleAccess(new Set(), `${entry.prefix}/child`, OWNER),
      true,
      `owner refused a nested path under ${entry.prefix}`
    );
  }
});

test("a manager is admitted exactly on the routes of the modules they hold", () => {
  for (const entry of ADMIN_ROUTE_PERMISSIONS) {
    const withModule = hasAdminModuleAccess(new Set([entry.perm]), entry.prefix, MANAGER);
    const nested = hasAdminModuleAccess(new Set([entry.perm]), `${entry.prefix}/child`, MANAGER);
    const withoutModule = hasAdminModuleAccess(new Set(), entry.prefix, MANAGER);

    if (entry.ownerOnly) {
      assert.equal(withModule, false, `manager admitted to owner-only ${entry.prefix} by perm alone`);
      assert.equal(nested, false, `manager admitted to owner-only ${entry.prefix}/child by perm alone`);
      assert.equal(withoutModule, false, `manager admitted to owner-only ${entry.prefix} with no grants`);
    } else {
      assert.equal(withModule, true, `manager holding "${entry.perm}" refused ${entry.prefix}`);
      assert.equal(nested, true, `manager holding "${entry.perm}" refused a nested ${entry.prefix} path`);
      assert.equal(withoutModule, false, `manager without "${entry.perm}" admitted ${entry.prefix}`);
    }
  }
});
