import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-[22px] font-bold tracking-[-0.02em] text-ink sm:text-[26px]">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-[12px] text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: "brand" | "accent" | "amber" | "rose";
}) {
  const isHero = tone === "brand";
  return (
    <div
      className={cn(
        "card card-hover p-5",
        isHero && "border-transparent bg-brand-700 text-white shadow-pop"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "text-xs",
            isHero ? "text-white/70" : "text-slate-500"
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            isHero ? "bg-forest-mid text-accent-400" : "bg-accent-100 text-brand-700"
          )}
        >
          <Icon className="h-[15px] w-[15px]" />
        </span>
      </div>
      <div
        className={cn(
          "mt-3 font-display text-[34px] font-bold leading-10 tracking-[-0.03em] tabular-nums",
          isHero ? "text-white" : "text-ink"
        )}
      >
        {value}
      </div>
      <div className="mt-3">
        {hint && (
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold",
              isHero
                ? "bg-forest-mid text-mint-soft"
                : "bg-brand-50 text-brand-800"
            )}
          >
            {hint}
          </span>
        )}
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-[17px] font-semibold tracking-[-0.01em] text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && (
        <Link
          href={action.href}
          className="group mt-5 inline-flex items-center gap-1.5 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-700/20 transition-all hover:-translate-y-0.5 hover:bg-brand-600"
        >
          {action.label}
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      )}
    </div>
  );
}

/** CRM-style filter pills: active = solid forest, inactive = white + hairline
    border. Rendered as Links so filter tabs stay server-navigable. */
export function TabPills({
  tabs,
  active,
  hrefFor,
}: {
  tabs: { key: string; label: string }[];
  active: string;
  hrefFor: (key: string) => string;
}) {
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={hrefFor(t.key)}
          className={cn(
            "rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors",
            active === t.key
              ? "bg-brand-700 text-white shadow-pop"
              : "border border-slate-200 bg-white text-slate-500 hover:border-brand-300 hover:text-brand-800"
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

const statusTones: Record<string, string> = {
  confirmed: "bg-brand-100 text-brand-800",
  pending: "bg-amber-100 text-amber-800",
  pending_consent: "bg-violet-100 text-violet-800",
  completed: "bg-accent-100 text-accent-800",
  addressed: "bg-accent-100 text-accent-800",
  no_follow_up: "bg-slate-100 text-slate-600",
  rescheduled: "bg-amber-100 text-amber-800",
  cancelled: "bg-rose-100 text-rose-700",
  paid: "bg-accent-100 text-accent-800",
  partial: "bg-amber-100 text-amber-800",
  approved: "bg-accent-100 text-accent-800",
  unapproved: "bg-amber-100 text-amber-800",
  open: "bg-brand-100 text-brand-800",
  closed: "bg-slate-100 text-slate-600",
  expired: "bg-amber-100 text-amber-800",
  "in-progress": "bg-violet-100 text-violet-800",
  active: "bg-accent-100 text-accent-800",
  inactive: "bg-slate-100 text-slate-600",
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const key = (status ?? "").toLowerCase();
  return (
    <span className={cn("badge capitalize", statusTones[key] ?? "bg-slate-100 text-slate-600")}>
      {(status ?? "—").replace(/_/g, " ")}
    </span>
  );
}
