import Link from "next/link";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  light = false,
}: {
  className?: string;
  light?: boolean;
}) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)}>
      <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 to-accent-600 shadow-md shadow-brand-700/25 transition-transform duration-300 group-hover:scale-105">
        <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-lg font-bold tracking-tight",
            light ? "text-white" : "text-ink"
          )}
        >
          Skora<span className="text-accent-500">Cares</span>
        </span>
        <span
          className={cn(
            "text-[10px] font-medium uppercase tracking-[0.2em]",
            light ? "text-white/60" : "text-ink-muted"
          )}
        >
          Clinic OS
        </span>
      </span>
    </Link>
  );
}
