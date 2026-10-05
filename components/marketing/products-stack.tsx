"use client";

import { useRef } from "react";
import { ArrowRight, Check } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { publicUploadUrl } from "@/lib/utils/uploads";
import type { LandingItem } from "@/lib/db/schema";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const PRODUCT_SEEDS = ["skora-platform", "skora-trust"];

export function ProductsStack({
  title,
  subtitle,
  items,
}: {
  title: string | null;
  subtitle: string | null;
  items: LandingItem[];
}) {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      /* Desire paradigm: cards pile up — each one recedes as the next slides
         over it (scrubbed against the incoming card's travel). */
      const cards = gsap.utils.toArray<HTMLElement>(".stack-card");
      cards.forEach((card, i) => {
        if (i === cards.length - 1) return;
        gsap.to(card, {
          scale: 0.93,
          filter: "brightness(0.72)",
          transformOrigin: "center top",
          ease: "none",
          scrollTrigger: {
            trigger: cards[i + 1],
            start: "top bottom",
            end: "top top+=130",
            scrub: true,
          },
        });
      });

      gsap.from(".stack-head", {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 80%", once: true },
      });
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="py-32 md:py-48">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="stack-head mb-20 max-w-3xl">
          <h2 className="font-editorial text-balance text-4xl font-semibold tracking-[-0.02em] text-ink md:text-6xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-6 text-pretty text-lg leading-relaxed text-ink-muted">
              {subtitle}
            </p>
          )}
        </div>

        <div className="space-y-8">
          {items.map((p, i) => {
            const feats = (p.features as unknown as string[]) ?? [];
            const img =
              publicUploadUrl(p.image) ??
              `https://picsum.photos/seed/${PRODUCT_SEEDS[i % PRODUCT_SEEDS.length]}/1200/900`;
            return (
              <article
                key={p.id}
                className="stack-card ambient-grain relative overflow-hidden rounded-[2.5rem] bg-navy-950 shadow-float lg:sticky lg:top-28"
              >
                {/* Ambient glow */}
                <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent-500/10 blur-[120px]" />

                <div className="relative z-10 grid gap-10 p-8 md:p-14 lg:grid-cols-2 lg:items-center lg:gap-16">
                  <div>
                    <span className="font-mono text-xs tracking-[0.3em] text-accent-400">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-4 font-editorial text-balance text-3xl font-semibold tracking-[-0.01em] text-white md:text-4xl">
                      {p.title}
                    </h3>
                    <p className="mt-5 max-w-xl text-pretty leading-relaxed text-white/65">
                      {p.description}
                    </p>

                    <ul className="mt-8 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                      {feats.map((feat) => (
                        <li
                          key={feat}
                          className="flex items-start gap-2.5 text-[15px] text-white/85"
                        >
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-500 text-navy-950">
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                          {feat}
                        </li>
                      ))}
                    </ul>

                    <a
                      href={p.link && !p.link.startsWith("#") ? p.link : "/contact"}
                      className="group mt-10 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-navy-950 transition-all hover:-translate-y-0.5 hover:bg-accent-100"
                    >
                      {(p.linkText ?? "Contact Sales").replace(/\s*(→|-)\s*$/, "").trim()}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </a>
                  </div>

                  <div className="group relative overflow-hidden rounded-3xl ring-1 ring-white/15">
                    <img
                      src={img}
                      alt={p.title ?? "Product"}
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover grayscale contrast-125 transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-transparent to-transparent" />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
