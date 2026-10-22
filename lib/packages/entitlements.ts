/**
 * Package entitlements — what a purchased package unlocks.
 *
 * Pure (no DB) so the guard call sites and the tests share one rule set.
 *
 * Rules:
 *  - Only the `doctor` role carries a plan. Staff tiers (receptionist, admin,
 *    manager, super_admin, patient) are never restricted by a plan: they act
 *    inside a practice, they don't buy one.
 *  - A doctor with no `packageId` is on trial (or is a seeded/legacy account):
 *    full access, matching "Full access during your trial" on the pricing page.
 *  - An unknown `packageId` is treated as unrestricted. Fulfillment validates
 *    the id against the catalog before writing it, so this is unreachable in
 *    practice; failing open keeps a paying doctor out of a lockout if a
 *    catalog row is ever renamed.
 *
 * Limits are enforced only on the WRITE paths (create staff / create role /
 * manage vendors). Existing rows are never revoked: a doctor who downgrades
 * keeps the staff and roles they already created, and only loses the ability
 * to add more.
 */

import { getPackagePlan } from "./config";

/** Gated features that exist as real modules in this app. */
type PackageFeature = "roleManagement" | "multiVendorLabTests";

export type Entitlements = {
  /** Purchased plan id, or null for trial/legacy. */
  packageId: string | null;
  packageName: string | null;
  /** null = no seat limit. */
  staffSeats: number | null;
  features: Record<PackageFeature, boolean>;
};

const UNRESTRICTED: Entitlements = {
  packageId: null,
  packageName: null,
  staffSeats: null,
  features: { roleManagement: true, multiVendorLabTests: true },
};

/** Structural minimum every caller can supply. */
type EntitlementBearer = { role: string; packageId?: string | null };

export function resolveEntitlements(user: EntitlementBearer): Entitlements {
  if (user.role !== "doctor") return UNRESTRICTED;
  if (!user.packageId) return UNRESTRICTED;
  const plan = getPackagePlan(user.packageId);
  if (!plan) return UNRESTRICTED;
  return {
    packageId: plan.id,
    packageName: plan.name,
    staffSeats: plan.staffSeats,
    features: {
      roleManagement: plan.roleManagement,
      multiVendorLabTests: plan.multiVendorLabTests,
    },
  };
}

/** True when the feature is included in the caller's plan. */
export function featureAllowed(ent: Entitlements, feature: PackageFeature): boolean {
  return ent.features[feature];
}

/** Seats left before the plan limit, or null when unrestricted. */
export function seatsRemaining(ent: Entitlements, used: number): number | null {
  if (ent.staffSeats === null) return null;
  return Math.max(0, ent.staffSeats - used);
}

export function seatLimitReached(ent: Entitlements, used: number): boolean {
  const remaining = seatsRemaining(ent, used);
  return remaining !== null && remaining <= 0;
}

export function seatLimitMessage(ent: Entitlements): string {
  if (ent.staffSeats === null) {
    return "Your plan does not include staff accounts. Upgrade your plan to add staff.";
  }
  return `Your plan includes ${ent.staffSeats} staff account${ent.staffSeats === 1 ? "" : "s"} and all are in use. Upgrade your plan to add more staff.`;
}

const FEATURE_LABEL: Record<PackageFeature, string> = {
  roleManagement: "Role management",
  multiVendorLabTests: "Multi-vendor lab tests",
};

/** Message for a blocked feature, or null when the feature is included. */
export function featureBlockedMessage(ent: Entitlements, feature: PackageFeature): string | null {
  if (featureAllowed(ent, feature)) return null;
  return `${FEATURE_LABEL[feature]} is not included in ${ent.packageName ?? "your plan"}. Upgrade your plan to use it.`;
}
