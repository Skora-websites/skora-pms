import type { LucideIcon } from "lucide-react";

export function WorkingHoursCard({
  icon: Icon,
  day,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  day: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide capitalize text-slate-400">{day}</p>
        <p className="truncate font-display text-sm font-bold text-slate-900">{title}</p>
        <p className="truncate text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}