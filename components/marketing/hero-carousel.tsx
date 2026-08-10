"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LandingItem } from "@/lib/db/schema";

export function HeroCarousel({ items }: { items: LandingItem[] }) {
  const [index, setIndex] = useState(0);
  const count = items.length;

  const go = useCallback(
    (dir: number) => setIndex((i) => (i + dir + count) % count),
    [count]
  );

  useEffect(() => {
    const id = setInterval(() => go(1), 6000);
    return () => clearInterval(id);
  }, [go]);

  if (count === 0) return null;
  const item = items[index];

  return (
    <div className="relative">
      <div key={index} className="animate-[fadeUp_0.6s_ease-out]">
        <div className="hero-badge mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-[13px] font-semibold text-brand-800 shadow-sm">
          <span className="h-2 w-2 animate-pulse-dot rounded-full bg-accent-500" />
          Trusted by 2,000+ healthcare providers
        </div>
        <h1 className="font-display text-[clamp(2.4rem,5vw,3.6rem)] font-extrabold leading-[1.1] tracking-tight text-ink">
          {item.title}
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-muted">
          {item.description}
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href={item.link ?? "/contact"}
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-700 to-accent-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-brand-700/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-700/40"
          >
            {item.linkText ?? "Request a demo"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 rounded-full border-2 border-brand-200 bg-white/70 px-7 py-3.5 font-semibold text-ink backdrop-blur transition-colors hover:border-brand-600 hover:text-brand-800"
          >
            Start Free Trial
          </a>
        </div>
      </div>

      <div className="mt-12 flex items-center gap-4">
        <div className="flex gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === index ? "w-8 bg-gradient-to-r from-brand-700 to-accent-600" : "w-2 bg-brand-900/15 hover:bg-brand-900/30"
              )}
            />
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => go(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-200 bg-white text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-800"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => go(1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-200 bg-white text-ink-muted transition-colors hover:border-brand-600 hover:text-brand-800"
            aria-label="Next slide"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
