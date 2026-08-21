import { ArrowRight, Check, Star } from "lucide-react";
import { getLandingData } from "@/lib/queries/landing";
import { HeroCarousel } from "@/components/marketing/hero-carousel";
import { Pricing } from "@/components/marketing/pricing";
import { Faq } from "@/components/marketing/faq";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getLandingData();

  const hero = data.get("hero");
  const features = data.get("features");
  const steps = data.get("how_it_works");
  const products = data.get("products");
  const testimonials = data.get("testimonials");
  const pricing = data.get("pricing");
  const faq = data.get("faq");
  const cta = data.get("cta");

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-accent-50/40 to-brand-50">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-600/5" />
        <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-accent-500/5" />
        <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-36 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:pt-44">
          <HeroCarousel items={hero?.items ?? []} />

          <div className="relative hidden lg:block">
            <div className="animate-float rounded-3xl border border-brand-900/5 bg-white p-7 shadow-float">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-700 to-accent-600 font-display text-base font-bold text-white">
                  AS
                </div>
                <div>
                  <p className="font-display text-sm font-semibold text-ink">Dr. Aarav Sharma</p>
                  <p className="text-xs text-ink-muted">General Physician · New Delhi</p>
                </div>
                <span className="badge ml-auto bg-accent-100 text-accent-800">Online</span>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { val: "128", label: "Patients this week" },
                  { val: "32", label: "Appointments today" },
                  { val: "₹48k", label: "Monthly billing" },
                  { val: "4.9★", label: "Patient rating" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-surface p-3.5">
                    <p className="font-display text-xl font-bold text-ink">{s.val}</p>
                    <p className="mt-0.5 text-[11px] text-ink-muted">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <div className="mb-1.5 flex justify-between text-xs text-ink-muted">
                  <span>Clinic capacity</span>
                  <span>72%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-brand-100">
                  <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-brand-700 to-accent-500" />
                </div>
              </div>
            </div>

            <div className="absolute -right-6 top-16 animate-float-slow rounded-2xl border border-brand-900/5 bg-white p-4 shadow-soft">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-100 text-lg">📋</span>
                <div>
                  <p className="text-xs font-semibold text-ink">Prescription</p>
                  <p className="text-[11px] text-ink-muted">Uploaded just now</p>
                </div>
              </div>
            </div>
            <div className="absolute -left-8 bottom-24 animate-float rounded-2xl border border-brand-900/5 bg-white p-4 shadow-soft [animation-delay:1.2s]">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-lg">📍</span>
                <div>
                  <p className="text-xs font-semibold text-ink">Home visit</p>
                  <p className="text-[11px] text-ink-muted">Map navigation ready</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-y border-brand-900/5 bg-navy-950 py-5">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-12 gap-y-3 px-5 text-sm text-white/60">
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-accent-400" /> HIPAA-grade security</span>
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-accent-400" /> Multi-clinic support</span>
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-accent-400" /> 24×7 support</span>
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-accent-400" /> WhatsApp integration</span>
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-accent-400" /> Made in India 🇮🇳</span>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      {features && (
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <SectionHeader section={features} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.items.map((f) => (
                <div
                  key={f.id}
                  className="group rounded-2xl border border-brand-900/10 bg-gradient-to-br from-brand-50/70 to-accent-50/50 p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-700/30 hover:shadow-soft"
                >
                  <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-xl bg-white text-2xl shadow-sm ring-1 ring-brand-900/5 transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-brand-700 group-hover:to-accent-600">
                    {f.icon}
                  </div>
                  <h3 className="font-display text-lg font-bold text-ink">{f.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── STATS BAND ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-r from-brand-800 to-accent-700 py-16">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/5" />
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-5 text-center lg:grid-cols-4 lg:px-8">
          {[
            { num: "2,000+", label: "Healthcare providers" },
            { num: "50K+", label: "Appointments managed" },
            { num: "12+", label: "Built-in modules" },
            { num: "99.9%", label: "Uptime guaranteed" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-display text-4xl font-extrabold text-white lg:text-5xl">{s.num}</p>
              <p className="mt-2 text-sm font-medium text-white/70">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      {steps && (
        <section className="bg-surface py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <SectionHeader section={steps} />
            <div className="relative mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              <div className="absolute left-[12.5%] right-[12.5%] top-7 hidden h-0.5 bg-gradient-to-r from-accent-500 to-brand-700 lg:block" />
              {steps.items.map((s) => (
                <div key={s.id} className="relative text-center">
                  <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-accent-500 bg-white font-display text-xl font-extrabold text-brand-800 shadow-md">
                    {s.badge}
                  </div>
                  <h4 className="mt-5 font-display text-base font-bold text-ink">{s.title}</h4>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-muted">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PRODUCTS ─────────────────────────────────────────────────── */}
      {products && (
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <SectionHeader section={products} />
            <div className="space-y-20">
              {products.items.map((p) => {
                const featList = (p.features as unknown as string[]) ?? [];
                const reverse = p.icon === "reverse";
                return (
                  <div
                    key={p.id}
                    className={`grid items-center gap-12 lg:grid-cols-2 ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}
                  >
                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-50 to-accent-50/60 p-12 ring-1 ring-brand-900/5">
                      <div className="mx-auto max-w-sm">
                        <div className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-brand-900/5">
                          <div className="flex items-center gap-3">
                            <span className="h-3 w-3 rounded-full bg-accent-500" />
                            <div className="h-2.5 flex-1 rounded-full bg-brand-100" />
                            <div className="h-2.5 w-8 rounded-full bg-accent-200" />
                          </div>
                          <div className="mt-4 space-y-3">
                            <div className="h-2.5 w-3/4 rounded-full bg-brand-100" />
                            <div className="h-2.5 w-1/2 rounded-full bg-brand-50" />
                            <div className="h-2.5 w-5/6 rounded-full bg-brand-100" />
                          </div>
                          <div className="mt-5 grid grid-cols-3 gap-3">
                            {["84", "12", "₹3.2k"].map((v) => (
                              <div key={v} className="rounded-xl bg-surface p-3 text-center">
                                <p className="font-display text-sm font-bold text-brand-800">{v}</p>
                                <p className="text-[10px] text-ink-muted">metric</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className="badge bg-brand-100 text-brand-800">{p.badge}</span>
                      <h3 className="mt-4 font-display text-2xl font-extrabold text-ink lg:text-3xl">
                        {p.title}
                      </h3>
                      <p className="mt-4 text-base leading-relaxed text-ink-muted">{p.description}</p>
                      <ul className="mt-6 space-y-3">
                        {featList.map((feat) => (
                          <li key={feat} className="flex items-start gap-2.5 text-[15px] text-ink">
                            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent-500 text-white">
                              <Check className="h-3 w-3" strokeWidth={3} />
                            </span>
                            {feat}
                          </li>
                        ))}
                      </ul>
                      <a
                        href={p.link ?? "/contact"}
                        className="group mt-8 inline-flex items-center gap-2 font-semibold text-brand-800 transition-colors hover:text-brand-600"
                      >
                        {p.linkText ?? "Contact Sales"}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ─────────────────────────────────────────────── */}
      {testimonials && (
        <section className="bg-surface py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <SectionHeader section={testimonials} />
            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.items.map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl border border-brand-900/10 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft"
                >
                  <div className="mb-4 flex gap-1">
                    {Array.from({ length: t.stars ?? 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-[15px] italic leading-relaxed text-ink-muted">
                    “{t.description}”
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-700 to-accent-600 font-display text-sm font-bold text-white">
                      {t.title}
                    </div>
                    <div>
                      <p className="font-display text-sm font-semibold text-ink">{t.linkText}</p>
                      <p className="text-xs text-ink-muted">{t.link}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PRICING ──────────────────────────────────────────────────── */}
      {pricing && (
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <SectionHeader section={pricing} />
            <Pricing items={pricing.items} />
          </div>
        </section>
      )}

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      {faq && (
        <section className="bg-surface py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <SectionHeader section={faq} />
            <Faq items={faq.items} />
            <div className="mt-10 text-center">
              <p className="text-sm text-ink-muted">Still have questions?</p>
              <a
                href="/contact"
                className="mt-2 inline-flex items-center gap-2 font-semibold text-brand-800 hover:text-brand-600"
              >
                Contact Support <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      {cta && (
        <section className="px-5 py-24 lg:px-8">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-r from-brand-800 to-accent-700 px-8 py-16 text-center">
            <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-white/5" />
            <h2 className="relative font-display text-3xl font-extrabold text-white lg:text-4xl">
              {cta.title}
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-lg text-white/80">{cta.subtitle}</p>
            <div className="relative mt-9 flex flex-wrap justify-center gap-4">
              <a
                href="/contact"
                className="rounded-full bg-white px-8 py-3.5 font-semibold text-brand-800 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                Start Free Trial
              </a>
              <a
                href="/contact"
                className="rounded-full border-2 border-white/70 px-8 py-3.5 font-semibold text-white transition-colors hover:bg-white/10"
              >
                Request a Demo
              </a>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function SectionHeader({
  section,
}: {
  section: { title: string | null; subtitle: string | null; metadata: unknown };
}) {
  const meta = (section.metadata ?? {}) as { badge?: string };
  return (
    <div className="mx-auto mb-14 max-w-2xl text-center">
      {meta.badge && (
        <span className="badge bg-brand-100 text-brand-800">{meta.badge}</span>
      )}
      <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-ink lg:text-4xl">
        {section.title}
      </h2>
      {section.subtitle && (
        <p className="mt-4 text-lg leading-relaxed text-ink-muted">{section.subtitle}</p>
      )}
    </div>
  );
}
