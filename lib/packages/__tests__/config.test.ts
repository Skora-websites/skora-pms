/**
 * Package catalog rules — the prices the purchase flow charges and the
 * durations it grants. Both directions are asserted: unknown ids never
 * resolve (no free plans, no display-name-as-id lookups) and every yearly
 * price beats twelve monthlies (the advertised "save 16.6%").
 *
 * Run: npm run test
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { getPackagePlan, getPackagePricing, PACKAGE_PLANS } from "../config";
import { DAY_MS } from "../../auth/trial";

const DAYS_PER_YEAR = 365 * DAY_MS;

test("the catalog exposes three distinct plans", () => {
  assert.equal(PACKAGE_PLANS.length, 3);
  assert.equal(new Set(PACKAGE_PLANS.map((p) => p.id)).size, PACKAGE_PLANS.length);
});

test("monthly grants 30 days and yearly grants a full year", () => {
  for (const plan of PACKAGE_PLANS) {
    assert.equal(getPackagePricing(plan.id, "monthly")!.days, 30);
    assert.equal(getPackagePricing(plan.id, "yearly")!.days, 365);
  }
});

test("durations are whole day multiples so access expiry is exact", () => {
  for (const plan of PACKAGE_PLANS) {
    assert.equal(plan.monthlyDays, 30);
    assert.ok(
      Math.abs(plan.yearlyDays * DAY_MS - DAYS_PER_YEAR) < DAY_MS / 1000,
      `${plan.id} yearly days must be a full year`,
    );
  }
});

test("yearly costs less than twelve monthlies", () => {
  for (const plan of PACKAGE_PLANS) {
    assert.ok(plan.yearlyAmount < 12 * plan.monthlyAmount, `${plan.id} yearly must be discounted`);
  }
});

test("prices match the seeded marketing landing items (paise)", () => {
  const byId = new Map(PACKAGE_PLANS.map((p) => [p.id, p]));
  assert.equal(byId.get("package-1")!.monthlyAmount, 79900);
  assert.equal(byId.get("package-1")!.yearlyAmount, 799000);
  assert.equal(byId.get("package-2")!.monthlyAmount, 129900);
  assert.equal(byId.get("package-2")!.yearlyAmount, 1299000);
  assert.equal(byId.get("package-3")!.monthlyAmount, 249900);
  assert.equal(byId.get("package-3")!.yearlyAmount, 2499000);
});

test("unknown package ids resolve to null — never a free or zero-priced plan", () => {
  assert.equal(getPackagePricing("package-9", "monthly"), null);
  assert.equal(getPackagePricing("", "monthly"), null);
  assert.equal(getPackagePricing("Package 1", "monthly"), null); // display title, not an id
  assert.equal(getPackagePlan("package-9"), null);
  assert.equal(getPackagePlan(""), null);
});
