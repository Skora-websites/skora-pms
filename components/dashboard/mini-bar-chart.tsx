"use client";

import { cn } from "@/lib/utils";

type Point = { label: string; count: number };

/** Lightweight bar chart (no chart lib needed — CSS bars). */
export function MiniBarChart({
  points,
  tone = "brand",
  height = 160,
}: {
  points: Point[];
  tone?: "brand" | "accent";
  height?: number;
}) {
  const max = Math.max(...points.map((p) => p.count), 1);
  const barColor = tone === "brand" ? "bg-brand-600" : "bg-accent-500";

  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {points.map((p) => (
        <div key={p.label} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex w-full flex-1 items-end">
            <div
              className={cn("w-full rounded-t-md transition-all", barColor, p.count === 0 && "opacity-25")}
              style={{ height: `${Math.max((p.count / max) * 100, 4)}%` }}
              title={`${p.label}: ${p.count}`}
            />
          </div>
          <span className="text-[9px] font-medium text-slate-400">
            {p.label.split("-")[1] ?? p.label}
          </span>
        </div>
      ))}
    </div>
  );
}