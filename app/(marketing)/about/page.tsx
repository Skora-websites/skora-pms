import type { Metadata } from "next";
import { Check, HeartPulse, ShieldCheck, Sparkles, Users } from "lucide-react";
import { PageHeader } from "@/components/marketing/page-header";

export const metadata: Metadata = { title: "About Us" };

const VALUES = [
  {
    icon: HeartPulse,
    title: "Care First",
    text: "Every feature is designed around one goal — helping doctors deliver better, faster, more personal care.",
  },
  {
    icon: ShieldCheck,
    title: "Trust & Privacy",
    text: "Patient data is sacred. We treat it with bank-grade encryption and strict access controls.",
  },
  {
    icon: Sparkles,
    title: "Simple by Design",
    text: "Powerful software shouldn't be complicated. If a feature takes more than two clicks, we redesign it.",
  },
  {
    icon: Users,
    title: "Partner for Life",
    text: "We grow with your practice — from a single clinic to multi-branch networks, our platform scales with you.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        badge="About Us"
        title="We're on a mission to modernize Indian clinics"
        subtitle="SkoraCares is built by healthcare technology specialists who believe every clinic — big or small — deserves enterprise-grade software at an affordable price."
      />

      <section className="py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="font-display text-3xl font-extrabold text-ink">
              Built for the way <span className="text-brand-700">Indian clinics</span> actually work
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-muted">
              Running a clinic means juggling appointments, prescriptions, billing, lab vendors,
              staff, and follow-ups — often all at once. SkoraCares was born out of conversations
              with doctors who wanted one place to manage it all without hiring an IT team.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-ink-muted">
              Today, thousands of healthcare providers across India use SkoraCares to run their
              daily operations — from solo practitioners to multi-branch hospitals — while
              keeping patient care personal and their practice profitable.
            </p>
            <div className="mt-8 space-y-3">
              {[
                "Online prescription upload & consent management",
                "Multi-clinic, multi-vendor, multi-user support",
                "Home visits with live map integration",
                "Income/expense ledgers built for Indian accounting",
              ].map((t) => (
                <div key={t} className="flex items-center gap-3 text-ink">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-500 text-white">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  {t}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl bg-gradient-to-br from-brand-800 to-accent-700 p-10 shadow-float">
              <p className="font-display text-5xl font-extrabold text-white">2,000+</p>
              <p className="mt-2 text-white/80">Healthcare providers trust SkoraCares</p>
              <div className="mt-8 grid grid-cols-3 gap-4">
                {[
                  { v: "50K+", l: "Appointments" },
                  { v: "12+", l: "Modules" },
                  { v: "99.9%", l: "Uptime" },
                ].map((s) => (
                  <div key={s.l} className="rounded-2xl bg-white/10 p-4 text-center backdrop-blur">
                    <p className="font-display text-xl font-bold text-white">{s.v}</p>
                    <p className="mt-1 text-xs text-white/70">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="badge bg-brand-100 text-brand-800">Our Values</span>
            <h2 className="mt-4 font-display text-3xl font-extrabold text-ink">
              What we stand for
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl border border-brand-900/10 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-soft"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-ink">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
