import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getLandingSectionsAdmin } from "@/lib/queries/super-admin";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { LandingEditor } from "./landing-editor";

export const metadata: Metadata = { title: "Landing Page · Super Admin" };

export default async function LandingPageAdmin() {
  await requireRole(["super_admin", "admin"]);
  const sections = await getLandingSectionsAdmin();

  const rows = sections.map((s) => ({
    id: s.id,
    key: s.key,
    name: s.name,
    title: s.title,
    subtitle: s.subtitle,
    isActive: s.isActive,
    metadata: s.metadata,
    items: s.items.map((i) => ({
      id: i.id,
      title: i.title,
      description: i.description,
      badge: i.badge,
      link: i.link,
      linkText: i.linkText,
      icon: i.icon,
      image: i.image,
      priceMonthly: i.priceMonthly,
      priceYearly: i.priceYearly,
      priceOriginalMonthly: i.priceOriginalMonthly,
      priceOriginalYearly: i.priceOriginalYearly,
      features: i.features,
      stars: i.stars,
      isActive: i.isActive,
    })),
  }));

  return (
    <div>
      <PageHeader
        title="Landing page content"
        subtitle="Every section of the marketing site is CMS-driven"
      />

      <LandingEditor sections={rows} />

      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-brand-100 bg-brand-50/50 p-5">
        <p className="text-sm text-brand-900">
          Content changes made here render instantly on the public site — including the FAQ section.
        </p>
        <Link href="/" className="group ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-brand-800 hover:text-brand-600">
          Preview public site <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}