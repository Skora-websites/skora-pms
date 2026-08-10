import type { Metadata } from "next";
import Link from "next/link";
import { PanelsTopLeft, ArrowUpRight } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getLandingData } from "@/lib/queries/landing";
import { PageHeader } from "@/components/ui/dashboard-ui";

export const metadata: Metadata = { title: "Landing Page · Super Admin" };

export default async function LandingPageAdmin() {
  await requireRole(["super_admin", "admin"]);
  const data = await getLandingData();
  const sections = [...data.values()];

  return (
    <div>
      <PageHeader
        title="Landing page content"
        subtitle="Every section of the marketing site is CMS-driven"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sections.map((s) => (
          <div key={s.id} className="card card-hover p-6">
            <div className="flex items-start justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 to-accent-600 text-white">
                <PanelsTopLeft className="h-5 w-5" />
              </span>
              <span className="badge bg-slate-100 text-slate-600">{s.items.length} items</span>
            </div>
            <h3 className="mt-4 font-display text-base font-bold text-slate-900">{s.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{s.title ?? "—"}</p>
            <p className="mt-1 font-mono text-xs text-slate-400">key: {s.key}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-brand-100 bg-brand-50/50 p-5">
        <p className="text-sm text-brand-900">
          Content changes made here (or via the database) render instantly on the public site.
        </p>
        <Link href="/" className="group ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-brand-800 hover:text-brand-600">
          Preview public site <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
