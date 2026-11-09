"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, ChevronRight, X, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

export type OnboardingStep = {
  label: string;
  hint: string;
  href: string;
  done: boolean;
};

const DISMISS_KEY = "skora-onboarding-dismissed";

/**
 * First-run setup checklist for the business owner (audit UX §7.2.2).
 *
 * Server pages compute each step's `done` from real entity counts, so the
 * checklist reflects actual progress rather than clicks. Dismissal is
 * per-browser (localStorage): the card auto-hides once every step is done,
 * so dismissal only needs to survive until then. Rendering nothing when all
 * steps are complete happens server-side — this component is not even
 * mounted in that case.
 */
export function OnboardingChecklist({
  steps,
  businessName,
}: {
  steps: OnboardingStep[];
  businessName: string;
}) {
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  // Avoid a flash: render nothing until localStorage has been read.
  if (dismissed === null || dismissed) return null;

  const doneCount = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done);

  return (
    <div className="card relative p-6">
      <button
        type="button"
        onClick={() => {
          window.localStorage.setItem(DISMISS_KEY, "1");
          setDismissed(true);
        }}
        aria-label="Dismiss setup checklist"
        className="absolute right-4 top-4 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>

      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
          <Rocket className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-[15px] font-semibold text-ink">
            Set up {businessName}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {doneCount} of {steps.length} complete
            {next ? ` · next: ${next.label.toLowerCase()}` : ""}
          </p>
        </div>
      </div>

      <ol className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {steps.map((step, i) => (
          <li key={step.label}>
            <Link
              href={step.href}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 transition",
                step.done
                  ? "border-brand-200 bg-brand-50/60"
                  : "border-slate-200 hover:border-brand-300 hover:bg-brand-50/40"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  step.done ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-500"
                )}
                aria-hidden="true"
              >
                {step.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate text-[13px] font-medium",
                    step.done ? "text-slate-400 line-through" : "text-ink"
                  )}
                >
                  {step.label}
                </span>
                <span className="block truncate text-[11px] text-slate-400">
                  {step.hint}
                </span>
              </span>
              {!step.done && (
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              )}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
