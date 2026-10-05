"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";
import type { LandingItem } from "@/lib/db/schema";

gsap.registerPlugin(useGSAP);

const ROTATE_MS = 7000;
const FALLBACK_GRADIENT = "linear-gradient(135deg,#114232,#1fd186)";

export function TestimonialsCarousel({ items }: { items: LandingItem[] }) {
  const count = items.length;
  const [index, setIndex] = useState(0);
  const quoteRef = useRef<HTMLDivElement>(null);

  const go = (dir: number) => setIndex((i) => (i + dir + count) % count);
  const current = items[Math.min(index, count - 1)];

  useGSAP(
    () => {
      const el = quoteRef.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.fromTo(
        el,
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.65, ease: "power3.out" }
      );
    },
    { dependencies: [index] }
  );

  useEffect(() => {
    if (count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => clearInterval(id);
  }, [count, index]);

  if (count === 0) return null;

  return (
    <div className="mx-auto max-w-4xl text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-accent-400 ring-1 ring-white/15">
        <Quote className="h-6 w-6" />
      </span>

      <div key={index} ref={quoteRef} className="mt-10">
        <blockquote className="font-editorial text-balance text-2xl font-medium leading-snug text-white md:text-[2.1rem]">
          &ldquo;{current.description}&rdquo;
        </blockquote>

        <div className="mt-9 flex items-center justify-center gap-1">
          {Array.from({ length: current.stars ?? 5 }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
          ))}
        </div>

        <div className="mt-7 flex items-center justify-center gap-4">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full font-display text-sm font-bold text-white ring-2 ring-white/20"
            style={{ background: current.badge || FALLBACK_GRADIENT }}
          >
            {current.title}
          </span>
          <div className="text-left">
            <p className="font-display text-sm font-semibold text-white">
              {current.linkText}
            </p>
            <p className="text-xs text-white/50">{current.link}</p>
          </div>
        </div>
      </div>

      <div className="mt-12 flex items-center justify-center gap-6">
        <button
          onClick={() => go(-1)}
          aria-label="Previous testimonial"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-white/60 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Overlapping avatar strip doubles as slide picker */}
        <div className="flex -space-x-3">
          {items.map((t, i) => (
            <button
              key={t.id}
              aria-label={`Show testimonial ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full font-display text-[11px] font-bold text-white ring-2 transition-all duration-300",
                i === index
                  ? "z-10 scale-110 ring-accent-400"
                  : "opacity-50 ring-white/20 hover:opacity-90"
              )}
              style={{ background: t.badge || FALLBACK_GRADIENT }}
            >
              {t.title}
            </button>
          ))}
        </div>

        <button
          onClick={() => go(1)}
          aria-label="Next testimonial"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-white/60 hover:text-white"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
