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
        <h1 className="font-display text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
          {title}
        </h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
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
  const tones = {
    brand: "from-brand-700 to-brand-500 bg-gradient-to-br",
    accent: "from-accent-600 to-accent-400 bg-gradient-to-br",
    amber: "from-amber-500 to-orange-400 bg-gradient-to-br",
    rose: "from-rose-600 to-pink-500 bg-gradient-to-br",
  };
  return (
    <div className="card card-hover p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-slate-900">{value}</p>
          {hint && <p className="mt-1 text-xs font-medium text-accent-700">{hint}</p>}
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-md", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
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
      <h3 className="mt-4 font-display text-base font-bold text-slate-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && (
        <Link
          href={action.href}
          className="group mt-5 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-700 to-accent-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-700/20 transition-all hover:-translate-y-0.5"
        >
          {action.label}
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      )}
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
