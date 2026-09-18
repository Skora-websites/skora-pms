"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, House, Loader2, PowerOff } from "lucide-react";
import { cn, type DutyMode } from "@/lib/utils";
import { setDutyMode } from "@/lib/actions/duty";

const MODES: { key: DutyMode; label: string; icon: typeof Building2 }[] = [
  { key: "off", label: "Off duty", icon: PowerOff },
  { key: "clinic", label: "Clinic", icon: Building2 },
  { key: "home", label: "Home visits", icon: House },
  { key: "both", label: "Both", icon: Building2 },
];

/**
 * "I'm on duty" toggle — the doctor picks a duty mode:
 * At clinic / Home visits / Both / Off duty.
 * Optimistic UI: switches immediately, reverts + shows the error if the
 * server action fails.
 */
export function DutyToggle({ initialMode }: { initialMode: DutyMode }) {
  const router = useRouter();
  const [mode, setMode] = useState<DutyMode>(initialMode);
  const [pendingMode, setPendingMode] = useState<DutyMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const select = (next: DutyMode) => {
    if (next === mode || pending) return;
    const prev = mode;
    setMode(next); // optimistic
    setPendingMode(next);
    setError(null);
    startTransition(async () => {
      const res = await setDutyMode(next);
      setPendingMode(null);
      if (res.error) {
        setMode(prev);
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div
        className="inline-flex flex-wrap items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm"
        role="group"
        aria-label="I'm on duty — choose duty mode"
      >
        <span className="pl-2.5 pr-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          I&rsquo;m on duty
        </span>
        {MODES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => select(key)}
            disabled={pending}
            aria-pressed={mode === key}
            title={label}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors",
              mode === key
                ? key === "off"
                  ? "bg-slate-700 text-white"
                  : "bg-brand-700 text-white shadow-pop"
                : "text-slate-500 hover:bg-brand-50 hover:text-brand-800"
            )}
          >
            {pendingMode === key ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Icon className="h-3.5 w-3.5" />
            )}
            <span className="hidden lg:inline">{label}</span>
          </button>
        ))}
      </div>
      {error && <p className="text-[11px] font-medium text-rose-600">{error}</p>}
    </div>
  );
}
