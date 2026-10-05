"use client";

import { useRef } from "react";
import {
  Bell,
  BookOpenText,
  Building2,
  FileText,
  FlaskConical,
  FolderOpen,
  MapPin,
  Package,
  PenLine,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { publicUploadUrl } from "@/lib/utils/uploads";
import type { LandingItem } from "@/lib/db/schema";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* CMS feature rows carry emoji glyphs; the landing page renders brand-safe
   Lucide icons instead. Unknown glyphs fall back to Sparkles. */
const ICONS: Record<string, LucideIcon> = {
  "📋": FileText,
  "✍️": PenLine,
  "🧪": FlaskConical,
  "👥": Users,
  "📦": Package,
  "📍": MapPin,
  "🏥": Building2,
  "📱": ShieldCheck,
  "🔐": ShieldCheck,
  "📒": BookOpenText,
  "🔔": Bell,
  "📁": FolderOpen,
};

function iconFor(item: LandingItem): LucideIcon {
  return (item.icon && ICONS[item.icon]) || Sparkles;
}

/* Interlocking bento spans on a 6-column grid (3x2 + 3 + 3 + 2 + 2 + 2 +
   3 + 3 + 2 + 2 + 2 + 6 = 36 cells = exactly 6 rows, zero dead cells). */
const SPANS = [
  "sm:col-span-2 lg:col-span-3 lg:row-span-2",
  "lg:col-span-3",
  "lg:col-span-3",
  "lg:col-span-2",
  "lg:col-span-2",
  "lg:col-span-2",
  "lg:col-span-3",
  "lg:col-span-3",
  "lg:col-span-2",
  "lg:col-span-2",
  "lg:col-span-2",
  "sm:col-span-2 lg:col-span-6",
];

export function FeaturesBento({
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

      /* Staggered rise for every tile. */
      gsap.from(".bento-tile", {
        y: 56,
        opacity: 0,
        duration: 0.8,
        stagger: 0.07,
        ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 78%", once: true },
      });

      /* Featured imagery grows into place as the grid enters. */
      gsap.utils.toArray<HTMLElement>(".bento-img").forEach((img) => {
        gsap.fromTo(
          img,
          { scale: 0.82, opacity: 0.25 },
          {
            scale: 1,
            opacity: 1,
            duration: 1.1,
            ease: "power2.out",
            scrollTrigger: { trigger: img, start: "top 88%", once: true },
          }
        );
      });
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="py-32 md:py-48">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto mb-20 max-w-3xl text-center">
          <h2 className="font-editorial text-balance text-4xl font-semibold tracking-[-0.02em] text-ink md:text-6xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-ink-muted">
              {subtitle}
            </p>
          )}
        </div>

        <div className="grid grid-flow-dense grid-cols-1 gap-3 sm:grid-cols-2 lg:auto-rows-[11.5rem] lg:grid-cols-6">
          {items.map((item, i) => {
            const Icon = iconFor(item);
            const span = SPANS[i % SPANS.length];
            const cmsImage = publicUploadUrl(item.image);
            const featured = i === 0;
            const wide = i === SPANS.length - 1 && items.length >= 12;

            if (featured) {
              const img = cmsImage ?? "https://picsum.photos/seed/skora-rx/1200/800";
              return (
                <div
                  key={item.id}
                  className={`group relative overflow-hidden rounded-3xl bg-navy-950 ${span}`}
                >
                  <img
                    src={img}
                    alt={item.title ?? "Feature"}
                    loading="lazy"
                    className="bento-img absolute inset-0 h-full w-full object-cover opacity-70 grayscale contrast-125 transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/45 to-transparent" />
                  <div className="relative z-10 flex h-full flex-col justify-end p-7">
                    <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20 backdrop-blur">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="font-editorial text-2xl font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-white/70">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            }

            if (wide) {
              const img = cmsImage ?? "https://picsum.photos/seed/skora-records/900/600";
              return (
                <div
                  key={item.id}
                  className={`group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_1px_3px_rgb(0_0_0/0.02),0_6px_16px_rgb(0_0_0/0.02)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lift md:flex-row md:items-center md:gap-10 ${span}`}
                >
                  <div className="flex-1">
                    <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-900/5 transition-colors duration-300 group-hover:bg-brand-700 group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="font-editorial text-2xl font-semibold text-ink">
                      {item.title}
                    </h3>
                    <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-ink-muted">
                      {item.description}
                    </p>
                  </div>
                  <div className="mt-6 h-36 w-full shrink-0 overflow-hidden rounded-2xl md:mt-0 md:h-40 md:w-64">
                    <img
                      src={img}
                      alt={item.title ?? "Patient records"}
                      loading="lazy"
                      className="bento-img h-full w-full object-cover grayscale contrast-125 transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  </div>
                </div>
              );
            }

            return (
              <div
                key={item.id}
                className={`group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgb(0_0_0/0.02),0_6px_16px_rgb(0_0_0/0.02)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lift ${span}`}
              >
                <div
                  aria-hidden
                  className="hatch pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-40"
                />
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-900/5 transition-colors duration-300 group-hover:bg-brand-700 group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="font-display text-[17px] font-bold text-ink">
                  {item.title}
                </h3>
                <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-ink-muted">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
