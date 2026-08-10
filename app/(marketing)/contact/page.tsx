import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { PageHeader } from "@/components/marketing/page-header";
import { ContactForm } from "./contact-form";
import { getCompanySettings } from "@/lib/queries/landing";

export const metadata: Metadata = { title: "Contact & Book a Demo" };

export default async function ContactPage() {
  const settings = await getCompanySettings();

  return (
    <>
      <PageHeader
        badge="Contact"
        title="Let's talk about your clinic"
        subtitle="Book a free demo, ask a question, or just say hello — our team responds within one business day."
      />

      <section className="py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div className="space-y-5">
            {[
              {
                icon: Phone,
                label: "Call us",
                value: settings?.companyMobile1 ?? "+91 921 7375 831",
                href: `tel:${(settings?.companyMobile1 ?? "+91 921 7375 831").replace(/\s/g, "")}`,
              },
              {
                icon: Mail,
                label: "Email us",
                value: settings?.companyEmail1 ?? "info@skoracares.com",
                href: `mailto:${settings?.companyEmail1 ?? "info@skoracares.com"}`,
              },
              {
                icon: MapPin,
                label: "Visit us",
                value: "SkoraSoft Technologies, New Delhi, India",
              },
              {
                icon: Clock,
                label: "Working hours",
                value: "Monday – Saturday: 10 AM – 7 PM",
              },
            ].map((c) => (
              <div
                key={c.label}
                className="flex items-start gap-4 rounded-2xl border border-brand-900/10 bg-white p-5 shadow-sm transition-all hover:border-brand-700/30 hover:shadow-soft"
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 to-accent-600 text-white">
                  <c.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    {c.label}
                  </p>
                  {c.href ? (
                    <a href={c.href} className="mt-0.5 block font-semibold text-ink hover:text-brand-800">
                      {c.value}
                    </a>
                  ) : (
                    <p className="mt-0.5 font-semibold text-ink">{c.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <ContactForm />
        </div>
      </section>
    </>
  );
}
