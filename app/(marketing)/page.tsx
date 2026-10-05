import {
  Building2,
  Headphones,
  MapPin,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { getLandingData } from "@/lib/queries/landing";
import { getCurrentUser } from "@/lib/auth/user";
import { isRazorpayConfigured } from "@/lib/packages/razorpay";
import { PACKAGE_PLANS } from "@/lib/packages/config";
import { LandingHero } from "@/components/marketing/landing-hero";
import { FeaturesBento } from "@/components/marketing/features-bento";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { ProductsStack } from "@/components/marketing/products-stack";
import { TestimonialsCarousel } from "@/components/marketing/testimonials-carousel";
import { Reveal } from "@/components/marketing/reveal";
import { Pricing } from "@/components/marketing/pricing";
import { Faq } from "@/components/marketing/faq";

export const dynamic = "force-dynamic";

const TRUST_ITEMS = [
  { icon: ShieldCheck, label: "DPDP-compliant, data in India" },
  { icon: Building2, label: "Multi-clinic support" },
  { icon: Headphones, label: "24x7 support" },
  { icon: MessageCircle, label: "WhatsApp integration" },
  { icon: MapPin, label: "Made in India" },
];

const STATS = [
  { num: "2,000+", label: "Healthcare providers" },
  { num: "50K+", label: "Appointments managed" },
  { num: "12+", label: "Built-in modules" },
  { num: "99.9%", label: "Uptime guaranteed" },
];

export default async function HomePage() {
  const data = await getLandingData();
  // Doctors see live checkout buttons on the pricing cards (Razorpay); every
  // other visitor keeps the marketing links.
  const user = await getCurrentUser();
  const checkoutPlans =
    user?.role === "doctor" && isRazorpayConfigured()
      ? PACKAGE_PLANS.map((p) => ({
          title: p.name,
          packageId: p.id,
          buyerName: user.name,
          buyerEmail: user.email,
          buyerPhone: user.phone,
        }))
      : undefined;

  const hero = data.get("hero");
  const features = data.get("features");
  const steps = data.get("how_it_works");
  const products = data.get("products");
  const testimonials = data.get("testimonials");
  const pricing = data.get("pricing");
  const faq = data.get("faq");
  const cta = data.get("cta");

  return (
    <div className="w-full max-w-full overflow-x-clip">
      {/* ── ATTENTION ──────────────────────────────────────────────────── */}
      <LandingHero items={hero?.items ?? []} />

      {/* ── Trust marquee ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-t border-white/10 bg-navy-950 py-6">
        <div className="marquee-track items-center">
          {[...TRUST_ITEMS, ...TRUST_ITEMS].map(({ icon: Icon, label }, i) => (
            <span
              key={i}
              className="flex items-center gap-3 whitespace-nowrap px-8 text-sm font-medium text-white/55"
            >
              <Icon className="h-4 w-4 text-accent-500" />
              {label}
              <span aria-hidden className="ml-8 h-1 w-1 rounded-full bg-white/20" />
            </span>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-navy-950 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-navy-950 to-transparent" />
      </div>

      {/* ── INTEREST: gapless feature bento ────────────────────────────── */}
      {features && (
        <FeaturesBento
          title={features.title}
          subtitle={features.subtitle}
          items={features.items}
        />
      )}

      {/* ── Stats band ─────────────────────────────────────────────────── */}
      <section className="ambient-grain relative overflow-hidden bg-navy-950 py-24">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent-500/10 blur-[120px]" />
        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-2 gap-y-12 px-5 lg:grid-cols-4 lg:px-8">
          {STATS.map((s, i) => (
            <Reveal
              key={s.label}
              delay={i * 0.08}
              className="border-white/10 text-center lg:[&:not(:first-child)]:border-l"
            >
              <p className="font-editorial text-5xl font-semibold tracking-tight text-white md:text-6xl">
                {s.num}
              </p>
              <p className="mt-3 text-xs font-medium uppercase tracking-[0.2em] text-white/45">
                {s.label}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── DESIRE: pinned steps ───────────────────────────────────────── */}
      {steps && (
        <HowItWorks
          title={steps.title}
          subtitle={steps.subtitle}
          items={steps.items.map((s) => ({
            id: s.id,
            title: s.title,
            description: s.description,
            badge: s.badge,
          }))}
        />
      )}

      {/* ── DESIRE: stacking product cards ─────────────────────────────── */}
      {products && (
        <ProductsStack
          title={products.title}
          subtitle={products.subtitle}
          items={products.items}
        />
      )}

      {/* ── Testimonials ───────────────────────────────────────────────── */}
      {testimonials && testimonials.items.length > 0 && (
        <section className="ambient-grain relative overflow-hidden bg-forest-deep py-32 md:py-48">
          <div className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-accent-500/10 blur-[130px]" />
          <div className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-brand-500/15 blur-[130px]" />
          <div className="relative z-10 mx-auto max-w-7xl px-5 lg:px-8">
            <Reveal className="mb-16 text-center">
              <h2 className="font-editorial text-balance text-4xl font-semibold tracking-[-0.02em] text-white md:text-6xl">
                {testimonials.title}
              </h2>
              {testimonials.subtitle && (
                <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-white/60">
                  {testimonials.subtitle}
                </p>
              )}
            </Reveal>
            <TestimonialsCarousel items={testimonials.items} />
          </div>
        </section>
      )}

      {/* ── ACTION: pricing ────────────────────────────────────────────── */}
      {pricing && (
        <section className="py-32 md:py-48">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <Reveal className="mx-auto mb-16 max-w-3xl text-center">
              <h2 className="font-editorial text-balance text-4xl font-semibold tracking-[-0.02em] text-ink md:text-6xl">
                {pricing.title}
              </h2>
              {pricing.subtitle && (
                <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-ink-muted">
                  {pricing.subtitle}
                </p>
              )}
            </Reveal>
            <Pricing items={pricing.items} checkoutPlans={checkoutPlans} />
          </div>
        </section>
      )}

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      {faq && (
        <section className="bg-surface py-32 md:py-48">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <Reveal className="mx-auto mb-14 max-w-3xl text-center">
              <h2 className="font-editorial text-balance text-4xl font-semibold tracking-[-0.02em] text-ink md:text-5xl">
                {faq.title}
              </h2>
              {faq.subtitle && (
                <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-ink-muted">
                  {faq.subtitle}
                </p>
              )}
            </Reveal>
            <Faq items={faq.items} />
            <div className="mt-12 text-center">
              <p className="text-sm text-ink-muted">Still have questions?</p>
              <a
                href="/contact"
                className="mt-2 inline-flex items-center gap-2 font-semibold text-brand-800 hover:text-brand-600"
              >
                Contact Support
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ── ACTION: massive closing CTA ────────────────────────────────── */}
      {cta && (
        <section className="ambient-grain relative overflow-hidden bg-navy-950 py-40 md:py-56">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[36rem] w-[70rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-500/10 blur-[160px]" />
          <div
            aria-hidden
            className="hatch pointer-events-none absolute inset-x-0 top-0 h-px opacity-60"
          />
          <Reveal className="relative z-10 mx-auto max-w-5xl px-5 text-center lg:px-8">
            <h2 className="font-editorial text-balance text-5xl font-semibold leading-[1.05] tracking-[-0.02em] text-white md:text-7xl">
              {cta.title}
            </h2>
            {cta.subtitle && (
              <p className="mx-auto mt-8 max-w-2xl text-pretty text-xl leading-relaxed text-white/65">
                {cta.subtitle}
              </p>
            )}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
              <a
                href="/signup"
                className="group inline-flex items-center rounded-full bg-white px-9 py-4.5 text-base font-semibold text-navy-950 shadow-xl shadow-black/25 transition-all hover:-translate-y-0.5 hover:bg-accent-100"
              >
                Start Free Trial
              </a>
              <a
                href="/contact"
                className="inline-flex items-center rounded-full border border-white/30 px-9 py-4.5 text-base font-semibold text-white transition-colors hover:border-white/60 hover:bg-white/10"
              >
                Request a Demo
              </a>
            </div>
            <p className="mt-8 text-sm text-white/45">
              No credit card required · Full access during your trial
            </p>
          </Reveal>
        </section>
      )}
    </div>
  );
}
