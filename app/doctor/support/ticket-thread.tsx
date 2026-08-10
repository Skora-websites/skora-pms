"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { replySupportTicket } from "../actions";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Message = {
  id: number;
  message: string;
  isAdminReply: boolean | null;
  createdAt: Date | null;
  senderName: string;
};

const initialState = { error: null as string | null };

export function TicketThread({
  ticketId,
  messages,
}: {
  ticketId: number;
  messages: Message[];
}) {
  const [state, formAction, pending] = useActionState(
    (prev: typeof initialState, formData: FormData) => replySupportTicket(ticketId, formData),
    initialState
  );

  return (
    <div className="px-5 py-4">
      <div className="space-y-3">
        {messages.length === 0 && (
          <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
            No messages yet.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
              m.isAdminReply
                ? "rounded-tl-sm bg-gradient-to-r from-brand-700 to-accent-700 text-white"
                : "rounded-tr-sm bg-slate-100 text-slate-800"
            )}
          >
            <p className="text-xs font-semibold opacity-70">
              {m.isAdminReply ? "SkoraCares Support" : m.senderName}
            </p>
            <p className="mt-1 whitespace-pre-wrap">{m.message}</p>
            <p className={cn("mt-1.5 text-[10px]", m.isAdminReply ? "text-white/60" : "text-slate-400")}>
              {formatDateTime(m.createdAt)}
            </p>
          </div>
        ))}
      </div>

      <form action={formAction} className="mt-4 flex gap-2">
        <input
          name="message"
          required
          placeholder="Write a reply…"
          className="input flex-1"
        />
        <button
          type="submit"
          disabled={pending}
          className="btn-primary !px-4"
          aria-label="Send reply"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
      {state.error && <p className="mt-2 text-xs text-red-600">{state.error}</p>}
    </div>
  );
}
