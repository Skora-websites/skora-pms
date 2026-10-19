"use server";

import { getCurrentUser } from "@/lib/auth/user";
import { isRazorpayConfigured } from "@/lib/packages/razorpay";
import { PACKAGE_PLANS } from "@/lib/packages/config";
import type { PricingCheckoutPlan } from "@/components/marketing/pricing";

/**
 * Live-checkout plans for the CURRENT visitor, or null when they should keep
 * the marketing links.
 *
 * Only a logged-in doctor with Razorpay configured gets plans. This is the same
 * rule the marketing server components used to apply inline — moved into an
 * action so those pages no longer read the session and can be statically
 * rendered (audit FR-025 / M13).
 */
export async function getCheckoutPlansForVisitor(): Promise<PricingCheckoutPlan[] | null> {
  const user = await getCurrentUser();
  if (user?.role !== "doctor" || !isRazorpayConfigured()) return null;

  return PACKAGE_PLANS.map((p) => ({
    title: p.name,
    packageId: p.id,
    buyerName: user.name,
    buyerEmail: user.email,
    buyerPhone: user.phone,
  }));
}
