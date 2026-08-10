"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingItem } from "@/lib/db/schema";

export function Faq({ items }: { items: LandingItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl">
      {items.map((faq, i) => {
        const isOpen = open === i;
        return (
          <div
            key={faq.id}
            className={cn(
              "border-b border-brand-900/10 transition-colors",
              isOpen && "border-brand-700/30"
            )}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
            >
              <span className={cn("font-display text-base font-semibold", isOpen ? "text-brand-800" : "text-ink")}>
                {faq.title}
              </span>
              <span
                className={cn(
                  "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                  isOpen
                    ? "rotate-45 border-transparent bg-gradient-to-br from-brand-700 to-accent-600 text-white"
                    : "border-brand-200 text-brand-700"
                )}
              >
                <Plus className="h-4 w-4" />
              </span>
            </button>
            <div
              className={cn(
                "grid transition-all duration-300 ease-out",
                isOpen ? "grid-rows-[1fr] pb-5 opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden text-[15px] leading-relaxed text-ink-muted">
                {faq.description}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
