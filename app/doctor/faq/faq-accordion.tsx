"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { id: number; title: string; description: string | null };

export function FaqAccordion({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isOpen = open === item.id;
        return (
          <div
            key={item.id}
            className={cn(
              "overflow-hidden rounded-2xl border transition",
              isOpen ? "border-brand-200 bg-brand-50/50" : "border-slate-200 bg-white"
            )}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : item.id)}
              className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
            >
              <span className="flex items-center gap-3">
                <HelpCircle className={cn("h-5 w-5 shrink-0", isOpen ? "text-brand-700" : "text-slate-400")} />
                <span className={cn("text-sm font-semibold", isOpen ? "text-brand-900" : "text-slate-700")}>
                  {item.title}
                </span>
              </span>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 shrink-0 text-brand-700" />
              ) : (
                <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
              )}
            </button>
            {isOpen && item.description && (
              <div className="px-6 pb-5">
                <p className="text-sm leading-relaxed text-slate-600">{item.description}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}