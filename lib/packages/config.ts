/**
 * Package catalog — single source of truth for the pricing plans.
 *
 * Mirrors the seeded marketing pricing items (scripts/seed.ts "Package 1/2/3")
 * but keyed by stable ids used in the checkout flow and the package_payments
 * audit table. Prices are in paise (Razorpay's currency unit).
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
};

export const PACKAGE_PLANS: PackagePlan[] = [
  {
    id: "package-1",
    name: "Package 1",
    monthlyDays: 30,
    yearlyDays: 365,
    monthlyAmount: 79900,
    yearlyAmount: 799000,
  },
  {
    id: "package-2",
    name: "Package 2",
    monthlyDays: 30,
    yearlyDays: 365,
    monthlyAmount: 129900,
    yearlyAmount: 1299000,
  },
  {
    id: "package-3",
    name: "Package 3",
    monthlyDays: 30,
    yearlyDays: 365,
    monthlyAmount: 249900,
    yearlyAmount: 2499000,
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
