"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingItem } from "@/lib/db/schema";

type PlanFeature = {
  name: string;
  included_monthly?: boolean;
  included_yearly?: boolean;
  text_monthly?: string;
  text_yearly?: string;
};

export function Pricing({ items }: { items: LandingItem[] }) {
  const [yearly, setYearly] = useState(false);

  return (
    <div>
      <div className="mb-10 flex items-center justify-center gap-3">
        <span className={cn("text-sm font-medium", !yearly ? "text-ink" : "text-ink-muted")}>
          Monthly
        </span>
        <button
          onClick={() => setYearly((v) => !v)}
          className={cn(
            "relative h-7 w-14 rounded-full transition-colors duration-300",
            yearly ? "bg-gradient-to-r from-brand-700 to-accent-600" : "bg-slate-300"
          )}
          aria-label="Toggle billing period"
        >
          <span
            className={cn(
              "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-300",
              yearly ? "left-8" : "left-1"
            )}
          />
        </button>
        <span className={cn("text-sm font-medium", yearly ? "text-ink" : "text-ink-muted")}>
          Yearly
        </span>
        <span className="badge bg-accent-100 text-accent-800">Save 16.6%</span>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {items.map((plan) => {
          const features = (plan.features as unknown as PlanFeature[]) ?? [];
          const featured = Boolean(plan.badge);
          const price = yearly ? Number(plan.priceYearly ?? 0) : Number(plan.priceMonthly ?? 0);
          const original = yearly ? Number(plan.priceOriginalYearly ?? 0) : Number(plan.priceOriginalMonthly ?? 0);
          return (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-3xl border p-8 transition-all duration-300 hover:-translate-y-1.5",
                featured
                  ? "border-brand-700 bg-gradient-to-b from-brand-50 to-accent-50/60 shadow-float"
                  : "border-brand-900/10 bg-white shadow-sm hover:shadow-soft"
              )}
            >
              {featured && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-brand-700 to-accent-600 px-5 py-1.5 text-xs font-bold text-white shadow-md">
                  {plan.badge}
                </span>
              )}
              <h3 className="text-sm font-bold uppercase tracking-widest text-brand-700">
                {plan.title}
              </h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-5xl font-extrabold text-ink">
                  ₹{price.toLocaleString("en-IN")}
                </span>
                <span className="text-sm text-ink-muted">/{yearly ? "year" : "month"}</span>
              </div>
              {original > price && (
                <p className="mt-1 text-sm text-ink-muted">
                  <span className="line-through">₹{original.toLocaleString("en-IN")}</span>{" "}
                  <span className="font-semibold text-accent-700">You save {yearly ? 16.6 : 0}%</span>
                </p>
              )}
              <ul className="mt-7 space-y-3">
                {features.map((f, i) => {
                  const included = yearly ? f.included_yearly : f.included_monthly;
                  const label = yearly ? f.text_yearly : f.text_monthly;
                  return (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-ink-muted">
                      {included ? (
                        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent-500 text-white">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-400">
                          <X className="h-3 w-3" strokeWidth={3} />
                        </span>
                      )}
                      <span className={cn(!included && "text-slate-400")}>{label ?? f.name}</span>
                    </li>
                  );
                })}
              </ul>
              <a
                href={plan.link ?? "/signup"}
                className={cn(
                  "mt-8 block rounded-full py-3 text-center text-sm font-semibold transition-all",
                  featured
                    ? "bg-gradient-to-r from-brand-700 to-accent-600 text-white shadow-lg shadow-brand-700/25 hover:-translate-y-0.5"
                    : "border-2 border-brand-200 text-brand-800 hover:border-brand-700 hover:bg-brand-50"
                )}
              >
                {plan.linkText ?? "Get Started"}
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
