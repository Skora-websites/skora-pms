"use client";

import { useState, useTransition } from "react";
import { Send, Lock } from "lucide-react";
import { adminReplyToTicket } from "./actions";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Message = {
  id: number;
  message: string;
  isAdminReply: boolean | null;
  createdAt: Date | null;
  senderName: string;
};

export function AdminTicketPanel({ ticketId, messages }: { ticketId: number; messages: Message[] }) {
  const [reply, setReply] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await adminReplyToTicket(ticketId, reply);
      if (res?.error) setError(res.error);
      else setReply("");
    });
  };

  return (
    <div className="px-5 py-4">
      <div className="space-y-3">
        {messages.length === 0 && (
          <p className="rounded-xl bg-slate-50 px-4 py-5 text-center text-sm text-slate-400">No messages.</p>
        )}
        {[...messages].reverse().map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
              m.isAdminReply
                ? "rounded-tr-sm bg-gradient-to-r from-brand-700 to-accent-700 text-white"
                : "rounded-tl-sm bg-slate-100 text-slate-800"
            )}
          >
            <p className="text-xs font-semibold opacity-70">
              {m.isAdminReply ? "Support team" : m.senderName}
            </p>
            <p className="mt-1 whitespace-pre-wrap">{m.message}</p>
            <p className={cn("mt-1.5 text-[10px]", m.isAdminReply ? "text-white/60" : "text-slate-400")}>
              {formatDateTime(m.createdAt)}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="mt-4 flex gap-2">
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Reply as support team…"
          className="input flex-1"
        />
        <button type="submit" disabled={pending} className="btn-primary !px-4" aria-label="Send reply">
          {pending ? <Lock className="h-4 w-4 animate-pulse" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
