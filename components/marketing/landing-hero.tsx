"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";
import { publicUploadUrl } from "@/lib/utils/uploads";
import type { LandingItem } from "@/lib/db/schema";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type HeroSlide = Pick<
  LandingItem,
  "id" | "title" | "description" | "link" | "linkText" | "image"
>;

const ROTATE_MS = 6500;

const FALLBACK_SLIDE: HeroSlide = {
  id: 0,
  title: "SkoraCares - Smarter Patient & Clinic Management",
  description:
    "Online Prescription Upload, Multi Clinic Management, Home Visit with Map Integration - everything your practice needs in one powerful platform.",
  link: "/contact#demo",
  linkText: "Request a demo",
  image: null,
};

/** CMS links pointing at dead anchors (#demo) are routed to the real demo
 *  booking section on the contact page. */
function ctaHref(link: string | null): string {
  if (!link || link.startsWith("#")) return "/contact#demo";
  return link;
}

function ctaLabel(text: string | null): string {
  return (text ?? "Request a demo").replace(/\s*(→|-)\s*$/, "").trim();
}

function imageFor(item: HeroSlide): string {
  return (
    publicUploadUrl(item.image) ??
    "https://picsum.photos/seed/skora-clinic/1600/1000"
  );
}

export function LandingHero({ items }: { items: HeroSlide[] }) {
  const slides = items.length > 0 ? items : [FALLBACK_SLIDE];
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const current = slides[Math.min(index, count - 1)];

  const sectionRef = useRef<HTMLElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  const go = useCallback(
    (dir: number) => setIndex((i) => (i + dir + count) % count),
    [count]
  );

  /* Intro: content rises in, background slowly settles. */
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.from("[data-hero-rise]", {
        y: 44,
        opacity: 0,
        duration: 0.9,
        stagger: 0.14,
        delay: 0.35,
        ease: "power3.out",
      });
      gsap.from(bgRef.current, {
        opacity: 0,
        scale: 1.07,
        duration: 1.8,
        ease: "power2.out",
      });

      /* Background drifts up as the visitor scrolls away (parallax wash). */
      gsap.to(bgRef.current, {
        yPercent: 14,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    },
    { scope: sectionRef }
  );

  /* Enter animation for the active slide (runs on mount and every change). */
  useGSAP(
    () => {
      const el = slideRef.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.fromTo(
        el,
        { y: 34, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }
      );
    },
    { scope: sectionRef, dependencies: [index] }
  );

  /* Autoplay: current slide exits upward, then the next one mounts. The
     timer restarts on every index change so manual navigation feels snappy. */
  useEffect(() => {
    if (count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      const el = slideRef.current;
      if (!el) return;
      gsap.to(el, {
        y: -26,
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
        onComplete: () => setIndex((i) => (i + 1) % count),
      });
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [count, index]);

  return (
    <section
      ref={sectionRef}
      className="ambient-grain relative flex min-h-[92svh] items-center overflow-hidden bg-navy-950"
    >
      {/* Full-bleed backdrop: photo, luminosity-blended under a forest wash */}
      <div ref={bgRef} className="absolute inset-0 will-change-transform">
        <img
          src="https://picsum.photos/seed/skora-clinic/1920/1080"
          alt=""
          aria-hidden
          className="h-full w-full object-cover opacity-20 grayscale contrast-125 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,rgba(13,38,30,0.5)_0%,rgba(7,30,23,0.9)_55%,#071e17_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/50 via-transparent to-navy-950" />
      </div>

      {/* Ambient mint glow */}
      <div className="pointer-events-none absolute -top-48 left-1/2 h-[34rem] w-[58rem] -translate-x-1/2 rounded-full bg-accent-500/10 blur-[140px]" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-20 pt-36 text-center lg:px-8">
        <div key={index} ref={slideRef}>
          <h1 className="font-editorial text-balance text-[clamp(2.5rem,5.5vw,5rem)] font-semibold leading-[1.04] tracking-[-0.02em] text-white">
            {current.title}
            <span className="mx-3 inline-block h-[0.62em] w-[1.7em] -translate-y-[0.06em] overflow-hidden rounded-full align-middle shadow-float ring-1 ring-white/25">
              <img
                src={imageFor(current)}
                alt=""
                className="h-full w-full object-cover"
              />
            </span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-pretty text-lg leading-relaxed text-white/65 md:text-xl">
            {current.description}
          </p>
        </div>

        <div
          data-hero-rise
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href={ctaHref(current.link)}
            className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-navy-950 shadow-xl shadow-black/25 transition-all hover:-translate-y-0.5 hover:bg-accent-100"
          >
            {ctaLabel(current.linkText)}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 px-8 py-4 text-base font-semibold text-white backdrop-blur transition-colors hover:border-white/60 hover:bg-white/10"
          >
            Start Free Trial
          </a>
        </div>

        {count > 1 && (
          <div
            data-hero-rise
            className="mt-16 flex items-center justify-center gap-5"
          >
            <button
              onClick={() => go(-1)}
              aria-label="Previous slide"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-white/60 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === index
                      ? "w-9 bg-accent-400"
                      : "w-1.5 bg-white/25 hover:bg-white/50"
                  )}
                />
              ))}
            </div>
            <button
              onClick={() => go(1)}
              aria-label="Next slide"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-white/60 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <span className="ml-2 font-mono text-xs tracking-widest text-white/40">
              {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
            </span>
          </div>
        )}

        <div data-hero-rise className="mt-14 flex justify-center">
          <div className="flex h-11 w-11 animate-bounce items-center justify-center rounded-full border border-white/15 text-white/50">
            <ArrowDown className="h-4 w-4" />
          </div>
        </div>
      </div>
    </section>
  );
}
