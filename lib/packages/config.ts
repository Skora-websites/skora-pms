/**
 * Package catalog — single source of truth for the pricing plans.
 *
 * Mirrors the seeded marketing pricing items (scripts/seed.ts "Package 1/2/3")
 * but keyed by stable ids used in the checkout flow and the package_payments
 * audit table. Prices are in paise (Razorpay's currency unit).
 *
 * `staffSeats` / `roleManagement` / `multiVendorLabTests` are the entitlements
 * the app actually enforces (see lib/packages/entitlements.ts) — the three
 * per-plan differentiators that map to real modules. "GMB Optimization" and
 * the landing/static/dynamic-page lines are marketing-site deliverables with
 * no module in this app, so they are advertised but deliberately NOT gated.
 */

export type PackagePeriod = "monthly" | "yearly";

export type PackagePlan = {
  id: string;
  name: string;
  /** Duration added per purchase, in days. */
  monthlyDays: number;
  yearlyDays: number;
  monthlyAmount: number; // paise
  yearlyAmount: number; // paise
  /** Practice staff accounts (receptionists etc.) the owner may create. */
  staffSeats: number;
  /** Custom roles + staff permission management. */
  roleManagement: boolean;
  /** Lab-vendor management (multi-vendor lab test bookings). */
  multiVendorLabTests: boolean;
};

export const PACKAGE_PLANS: PackagePlan[] = [
  {
    id: "package-1",
    name: "Package 1",
    monthlyDays: 30,
    yearlyDays: 365,
    monthlyAmount: 79900,
    yearlyAmount: 799000,
    staffSeats: 1,
    roleManagement: false,
    multiVendorLabTests: false,
  },
  {
    id: "package-2",
    name: "Package 2",
    monthlyDays: 30,
    yearlyDays: 365,
    monthlyAmount: 129900,
    yearlyAmount: 1299000,
    staffSeats: 3,
    roleManagement: true,
    multiVendorLabTests: true,
  },
  {
    id: "package-3",
    name: "Package 3",
    monthlyDays: 30,
    yearlyDays: 365,
    monthlyAmount: 249900,
    yearlyAmount: 2499000,
    staffSeats: 5,
    roleManagement: true,
    multiVendorLabTests: true,
  },
];

export function getPackagePlan(packageId: string): PackagePlan | null {
  return PACKAGE_PLANS.find((p) => p.id === packageId) ?? null;
}

/** Resolves amount + duration days for a plan/period pair. */
export function getPackagePricing(
  packageId: string,
  period: PackagePeriod
): { plan: PackagePlan; amount: number; days: number } | null {
  const plan = getPackagePlan(packageId);
  if (!plan) return null;
  return period === "yearly"
    ? { plan, amount: plan.yearlyAmount, days: plan.yearlyDays }
    : { plan, amount: plan.monthlyAmount, days: plan.monthlyDays };
}
