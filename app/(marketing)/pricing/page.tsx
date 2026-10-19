import type { Metadata } from "next";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/marketing/page-header";
import { PricingWithCheckout } from "./checkout-resolver";
import { getLandingData } from "@/lib/queries/landing";

export const metadata: Metadata = { title: "Pricing" };

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const data = await getLandingData();
  const pricing = data.get("pricing");

  return (
    <>
      <PageHeader
        badge="Pricing"
        title="Simple pricing that grows with your clinic"
        subtitle="Start with a free trial — no credit card required. Pick a plan when you're ready; upgrade or downgrade anytime."
      />

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          {pricing ? (
            <PricingWithCheckout items={pricing.items} />
          ) : (
            <p className="text-center text-ink-muted">
              Plans are being updated — please check back shortly or{" "}
              <a href="/contact" className="font-semibold text-brand-800 underline">
                contact us
              </a>
              .
            </p>
          )}
        </div>
      </section>

      <section className="border-t border-brand-900/5 bg-surface py-14">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-12 gap-y-3 px-5 text-sm text-ink-muted">
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-accent-600" /> Free 15-day trial</span>
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-accent-600" /> No credit card required</span>
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-accent-600" /> Cancel anytime</span>
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-accent-600" /> Support in English & Hindi</span>
        </div>
      </section>
    </>
  );
}
