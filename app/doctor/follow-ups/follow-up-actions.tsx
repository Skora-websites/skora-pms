"use client";

import { useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { updateFollowUpStatus } from "../actions";

export function FollowUpActions({
  consultationId,
  status,
}: {
  consultationId: number;
  status: string;
}) {
  const [pending, startTransition] = useTransition();

  if (status !== "pending") return null;

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => updateFollowUpStatus(consultationId, "completed"))}
      className="inline-flex items-center gap-1.5 rounded-full bg-accent-100 px-3.5 py-1.5 text-xs font-semibold text-accent-800 transition-colors hover:bg-accent-200 disabled:opacity-50"
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      Mark completed
    </button>
  );
}
