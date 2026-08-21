"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setTicketPriority } from "../actions";
import { cn } from "@/lib/utils";

const PRIORITIES = ["low", "normal", "high", "urgent"] as const;

const PRIORITY_TONES: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  normal: "bg-brand-50 text-brand-800",
  high: "bg-amber-50 text-amber-800",
  urgent: "bg-red-50 text-red-700",
};

export function TicketPrioritySelect({
  ticketId,
  current,
}: {
  ticketId: number;
  current: string;
}) {
  const [pending, setPending] = useState(false);
  const [value, setValue] = useState(current);
  const router = useRouter();

  async function handleChange(priority: string) {
    if (priority === value) return;
    setPending(true);
    const res = await setTicketPriority(ticketId, priority);
    if (!res?.error) setValue(priority);
    setPending(false);
    router.refresh();
  }

  return (
    <select
      value={value}
      disabled={pending}
      onChange={(e) => handleChange(e.target.value)}
      className={cn(
        "rounded-lg border px-2.5 py-1 text-xs font-semibold capitalize disabled:opacity-50",
        PRIORITY_TONES[value] ?? PRIORITY_TONES.normal
      )}
      title="Ticket priority"
    >
      {PRIORITIES.map((p) => (
        <option key={p} value={p}>{p}</option>
      ))}
    </select>
  );
}