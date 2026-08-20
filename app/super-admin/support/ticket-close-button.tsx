"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { closeTicket } from "../actions";

export function TicketCloseButton({ ticketId }: { ticketId: number }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleClose() {
    setPending(true);
    await closeTicket(ticketId);
    setPending(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClose}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-accent-300 hover:bg-accent-50 hover:text-accent-800 disabled:opacity-50"
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      {pending ? "Closing…" : "Close ticket"}
    </button>
  );
}