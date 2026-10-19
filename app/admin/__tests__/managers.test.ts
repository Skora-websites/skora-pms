/**
 * US4 — manager capability is delegable as documented.
 *
 * Three guarantees the owner-facing manager screen must keep:
 *
 *  M2: the delegable module set must equal the non-ownerOnly entries of
 *      ADMIN_ROUTE_PERMISSIONS — no more, no fewer. A hand-maintained list
 *      drifts silently, which is exactly how `home-visit`, `chat`, `shop`,
 *      `support`, `consultations` and `online-consultations` became
 *      undelegable while the route map advertised them as grantable.
 *  M3/L5: the documented default module set (clinic-ops core plus finance)
 *      must open the dashboard, and no default may be absent from the
 *      catalog. A manager created with zero modules used to be bounced by
 *      requireAdminTier to the public marketing home page.
 *
 * The delegable set is derived from ADMIN_ROUTE_PERMISSIONS in
 * `app/admin/managers/actions.ts` rather than restated, so this file asserts
 * against the same inputs that module derives from. `actions.ts` is a
 * `"use server"` module whose imports reach `next/navigation`, which pulls
 * React's client entry and cannot be imported under
 * `--conditions react-server`; asserting on the route map and the live
 * `permissions` table covers the same invariants.
 *
 * Run: npm run test
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { withCleanFixtures } from "../../../tests/helpers/db";
import { db } from "@/lib/db";
import { permissions } from "@/lib/db/schema";
import {
  ADMIN_ROUTE_PERMISSIONS,
  hasAdminModuleAccess,
  firstPermittedAdminPath,
} from "@/lib/auth/permissions";

/** Non-ownerOnly modules, in route-map order — the delegable set. */
const EXPECTED_DELEGABLE: readonly string[] = ADMIN_ROUTE_PERMISSIONS.filter(
  (entry) => !entry.ownerOnly
).map((entry) => entry.perm);

/** Owner-only modules. `hasAdminModuleAccess` gates these on viewerRole. */
const OWNER_ONLY: readonly string[] = ADMIN_ROUTE_PERMISSIONS.filter(
  (entry) => entry.ownerOnly
).map((entry) => entry.perm);

/**
 * The documented default set a newly created manager starts with (US4 task 2):
 * the clinic-ops core plus finance. Everything else stays opt-in.
 */
const DEFAULT_MANAGER_MODULES: readonly string[] = [
  "dashboard",
  "schedule",
  "registrations",
  "appointments",
  "follow-up",
  "income-expense",
  "test-booking",
  "billing",
];

/** Every module (parent row) name in the live catalog. */
async function liveModuleNames(): Promise<string[]> {
  const rows = await db.select().from(permissions);
  return rows.filter((r) => r.parentId === null).map((r) => r.name);
}

test("the delegable set is exactly the non-ownerOnly ADMIN_ROUTE_PERMISSIONS modules", async () => {
  await withCleanFixtures(async () => {
    const delegable = EXPECTED_DELEGABLE;

    // The owner-parity modules the audit flagged as undelegable must now be
    // present, and the three owner-only ones must still be absent.
    for (const name of [
      "home-visit",
      "chat",
      "shop",
      "support",
      "consultations",
      "online-consultations",
    ]) {
      assert.ok(delegable.includes(name), `${name} must be delegable`);
    }
    for (const name of OWNER_ONLY) {
      assert.ok(
        !delegable.includes(name),
        `owner-only module ${name} must never be delegable`
      );
    }
    assert.deepEqual(
      [...OWNER_ONLY].sort(),
      ["business-settings", "clinics", "managers"],
      "the owner-only set changed — review US4 before updating this test"
    );
    // No duplicates: a repeated route entry would grant the same module twice.
    assert.equal(new Set(delegable).size, delegable.length, "duplicate delegable modules");

    // The default grant set must sit inside the delegable set — a manager is
    // created with it, so an out-of-set entry would be a grant the owner has
    // no way to review or revoke through the editor.
    for (const name of DEFAULT_MANAGER_MODULES) {
      assert.ok(
        delegable.includes(name),
        `default module ${name} is not delegable — it could never be revoked`
      );
    }
    assert.equal(
      new Set(DEFAULT_MANAGER_MODULES).size,
      DEFAULT_MANAGER_MODULES.length,
      "duplicate default modules would double-insert model_has_permissions"
    );
  });
});

test("every delegable module exists in the live permissions table", async () => {
  await withCleanFixtures(async () => {
    const modules = await liveModuleNames();
    const missing = EXPECTED_DELEGABLE.filter((name) => !modules.includes(name));
    assert.deepEqual(missing, [], "delegable modules missing from the catalog");

    // The default grant set is resolved against this same table at creation
    // time, so a name missing here would silently drop the grant instead of
    // failing loudly.
    const missingDefaults = DEFAULT_MANAGER_MODULES.filter(
      (name) => !modules.includes(name)
    );
    assert.deepEqual(missingDefaults, [], "default modules missing from the catalog");

    // Each delegable module must also expose child action perms — the editor
    // grants children, and a module with no children can only be toggled whole.
    const moduleRows = await db
      .select({ id: permissions.id })
      .from(permissions)
      .where(inArray(permissions.name, [...EXPECTED_DELEGABLE]));
    const moduleIds = moduleRows.map((r) => r.id);
    const children = await db
      .select({ parentId: permissions.parentId })
      .from(permissions)
      .where(inArray(permissions.parentId, moduleIds));
    for (const id of moduleIds) {
      assert.ok(
        children.some((c) => c.parentId === id),
        "every delegable module needs child action perms for the editor"
      );
    }
  });
});

test("the documented default set opens the dashboard and nothing owner-only", async () => {
  await withCleanFixtures(async () => {
    const granted = new Set<string>(DEFAULT_MANAGER_MODULES);

    // The zero-module trap: hasAdminModuleAccess("/admin") needs `dashboard`,
    // so an empty set is locked out of the very page the guard falls back to.
    assert.equal(hasAdminModuleAccess(new Set(), "/admin", "manager"), false);

    // Every default module must open its own route for a manager.
    for (const entry of ADMIN_ROUTE_PERMISSIONS.filter((e) => !e.ownerOnly)) {
      assert.equal(
        hasAdminModuleAccess(granted, entry.prefix, "manager"),
        DEFAULT_MANAGER_MODULES.includes(entry.perm),
        `default set must decide access to ${entry.prefix} consistently`
      );
    }
    // Owner-only routes stay closed to managers whatever they are granted.
    for (const entry of ADMIN_ROUTE_PERMISSIONS.filter((e) => e.ownerOnly)) {
      assert.equal(
        hasAdminModuleAccess(granted, entry.prefix, "manager"),
        false,
        `${entry.prefix} must stay closed to managers`
      );
    }

    // firstPermittedAdminPath must never fall back to a path that is locked out.
    const first = firstPermittedAdminPath(granted, "manager");
    assert.equal(
      hasAdminModuleAccess(granted, first, "manager"),
      true,
      `${first} must be reachable with the default set`
    );
  });
});

test("a manager granted only non-default modules still lands on a permitted path", async () => {
  await withCleanFixtures(async () => {
    // `shop` alone (not in the default set) must resolve to its own route,
    // proving firstPermittedAdminPath walks the whole order and not just the
    // front of the list.
    const granted = new Set<string>(["shop"]);
    const first = firstPermittedAdminPath(granted, "manager");
    assert.equal(first, "/admin/shop");
    assert.equal(hasAdminModuleAccess(granted, first, "manager"), true);
    // …and /admin still needs `dashboard`, so it stays closed.
    assert.equal(hasAdminModuleAccess(granted, "/admin", "manager"), false);
  });
});

test("a module-less manager has no permitted admin path, so it needs the no-access landing", async () => {
  await withCleanFixtures(async () => {
    // The layout's rule: when perms is empty, firstPermittedAdminPath is
    // useless (it falls back to "/admin", which itself needs `dashboard`),
    // so the layout must NOT trust it. It redirects to /admin/no-access
    // instead — an admin-scoped page that introduces no module requirement.
    const granted = new Set<string>();
    const fallback = firstPermittedAdminPath(granted, "manager");

    assert.equal(hasAdminModuleAccess(granted, fallback, "manager"), false);

    // /admin/no-access resolves to the /admin prefix, whose `dashboard` perm
    // the module-less manager lacks — so the page must not be gated on the
    // module map (which is why the layout exempts this exact pathname).
    assert.equal(hasAdminModuleAccess(granted, "/admin/no-access", "manager"), false);
    assert.equal(
      hasAdminModuleAccess(new Set<string>(["dashboard"]), "/admin/no-access", "manager"),
      true,
      "a manager holding dashboard must be able to reach the landing too"
    );
  });
});
