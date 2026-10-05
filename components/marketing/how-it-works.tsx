"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type StepItem = {
  id: number;
  title: string | null;
  description: string | null;
  badge: string | null;
};

const STEP_SEEDS = ["skora-setup", "skora-clinic", "skora-patients", "skora-grow"];

export function HowItWorks({
  title,
  subtitle,
  items,
}: {
  title: string | null;
  subtitle: string | null;
  items: StepItem[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const mm = gsap.matchMedia();

      /* Desire paradigm: pin the editorial title on the left while the step
         gallery scrolls past on the right (desktop only). */
      mm.add("(min-width: 1024px)", () => {
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "top 130px",
          end: "bottom bottom",
          pin: leftRef.current,
          pinSpacing: false,
        });
      });

      /* Step cards rise in; their imagery grows from 0.8 into place. */
      gsap.utils.toArray<HTMLElement>(".step-card").forEach((card) => {
        gsap.from(card, {
          y: 64,
          opacity: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: card, start: "top 85%", once: true },
        });
        const img = card.querySelector(".step-img");
        if (img) {
          gsap.fromTo(
            img,
            { scale: 0.8, opacity: 0.3 },
            {
              scale: 1,
              opacity: 1,
              duration: 1.1,
              ease: "power2.out",
              scrollTrigger: { trigger: card, start: "top 85%", once: true },
            }
          );
        }
      });
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="relative bg-surface py-32 md:py-48">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.15fr] lg:gap-24">
          {/* Pinned editorial title */}
          <div ref={leftRef}>
            <div className="lg:sticky lg:top-32">
              <h2 className="font-editorial text-balance text-4xl font-semibold tracking-[-0.02em] text-ink md:text-6xl">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-ink-muted">
                  {subtitle}
                </p>
              )}
              <div className="mt-10 hidden items-center gap-3 lg:flex">
                <span className="h-px w-16 bg-accent-500" />
                <span className="font-mono text-xs tracking-[0.3em] text-ink-muted">
                  {String(items.length).padStart(2, "0")} STEPS
                </span>
              </div>
            </div>
          </div>

          {/* Scrolling step gallery */}
          <div className="space-y-20 md:space-y-28">
            {items.map((step, i) => (
              <div key={step.id} className="step-card">
                <div className="relative overflow-hidden rounded-3xl shadow-float">
                  <img
                    src={`https://picsum.photos/seed/${STEP_SEEDS[i % STEP_SEEDS.length]}/1200/800`}
                    alt={step.title ?? "Step"}
                    loading="lazy"
                    className="step-img aspect-[4/3] w-full object-cover grayscale contrast-125"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-transparent to-transparent" />
                  <span className="absolute bottom-5 left-5 font-editorial text-6xl font-semibold text-white/90">
                    {step.badge ?? String(i + 1)}
                  </span>
                </div>
                <div className="mt-7 flex items-start gap-5">
                  <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-700 font-display text-sm font-bold text-white">
                    {step.badge ?? i + 1}
                  </span>
                  <div>
                    <h3 className="font-editorial text-2xl font-semibold text-ink">
                      {step.title}
                    </h3>
                    <p className="mt-2 max-w-lg text-pretty leading-relaxed text-ink-muted">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
