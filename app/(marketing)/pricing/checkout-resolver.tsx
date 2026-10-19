"use client";

import { useEffect, useState } from "react";
import { Pricing } from "@/components/marketing/pricing";
import type { PricingCheckoutPlan } from "@/components/marketing/pricing";
import type { LandingItem } from "@/lib/db/schema";
import { getCheckoutPlansForVisitor } from "./actions";

/**
 * Doctor-only checkout plans, resolved AFTER the static page ships.
 *
 * The marketing pages used to call `getCurrentUser()` in their server
 * component to decide whether to render live Razorpay buttons. That made two
 * public routes session-coupled — permanently un-renderable as static/ISR —
 * and pushed the logged-in doctor's name, email and phone into the RSC payload
 * of a page anyone can load (audit FR-025 / M13).
 *
 * The decision now happens in a server action the client calls once on mount.
 * Anonymous visitors keep the static "sign up" buttons; only a logged-in
 * doctor's own authenticated response carries their PII.
 */
export function PricingWithCheckout({ items }: { items: LandingItem[] }) {
  const [plans, setPlans] = useState<PricingCheckoutPlan[] | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    void getCheckoutPlansForVisitor().then((p) => {
      if (alive) setPlans(p ?? undefined);
    });
    return () => {
      alive = false;
    };
  }, []);

  return <Pricing items={items} checkoutPlans={plans} />;
}
