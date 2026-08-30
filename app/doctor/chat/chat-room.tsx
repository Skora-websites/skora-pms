"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import {
  Bell,
  BellOff,
  Check,
  Eraser,
  Pencil,
  Search,
  Send,
  Star,
  Trash2,
  X,
} from "lucide-react";
import {
  clearChat,
  deleteChatMessage,
  pollChatMessages,
  sendChatMessage,
  toggleChatFavorite,
  toggleChatMute,
  updateChatMessage,
} from "./actions";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  timestamp: Date | null;
  isMine: boolean;
  isFavorite: boolean;
};

const initialState = { error: null as string | null };
const POLL_MS = 5000;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Manual formatting keeps the server & client renders identical (avoids ICU hydration mismatch).
function dayLabel(ts: Date | null): string | null {
  if (!ts) return null;
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (same(d, today)) return "Today";
  if (same(d, yesterday)) return "Yesterday";
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function timeLabel(ts: Date | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  let h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, "0")} ${ampm}`;
}

export function ChatRoom({
  roomId,
  initialMessages,
  muted,
  memberCount,
}: {
  roomId: number;
  initialMessages: ChatMessage[];
  muted: boolean;
  memberCount: number;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [search, setSearch] = useState("");
  const [isMuted, setIsMuted] = useState(muted);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [state, formAction, pending] = useActionState(sendChatMessage, initialState);
  const bottomRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the composer after a successful send.
  useEffect(() => {
    if (state.error === null) formRef.current?.reset();
  }, [state]);
  const lastIdRef = useRef(initialMessages[initialMessages.length - 1]?.id ?? 0);

  // Auto-scroll to the newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, search]);

  // Poll for new messages
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const fresh = (await pollChatMessages(lastIdRef.current)) as unknown as ChatMessage[];
        if (fresh.length > 0) {
          lastIdRef.current = fresh[fresh.length - 1].id;
          // Dedupe by id in case two polls overlap while a response is in flight.
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m.id));
            const onlyNew = fresh.filter((m) => !seen.has(m.id));
            return onlyNew.length > 0 ? [...prev, ...onlyNew] : prev;
          });
        }
      } catch {
        /* network hiccup — retry next tick */
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [roomId]);

  const run = useCallback(async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }, []);

  const visible = search.trim()
    ? messages.filter((m) => m.content.toLowerCase().includes(search.trim().toLowerCase()))
    : messages;

  // Pure helper: returns the divider label for a message index (or null).
  const dividerFor = (i: number): string | null => {
    const cur = dayLabel(visible[i]?.timestamp ?? null);
    if (cur === null) return null;
    const prev = i > 0 ? dayLabel(visible[i - 1].timestamp) : null;
    return cur !== prev ? cur : null;
  };

  return (
    <div className="card overflow-hidden">
      {/* Chat header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-700 to-accent-600 font-display text-sm font-bold text-white">
          DG
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-bold text-slate-900">Doctors Group</p>
          <p className="text-xs text-slate-400">
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-accent-500 align-middle" />
            {memberCount} member{memberCount === 1 ? "" : "s"} · {messages.length} messages
          </p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages…"
            className="input !py-2 !pl-9 !text-sm"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => run(toggleChatMute).then(() => setIsMuted((v) => !v))}
            disabled={busy}
            title={isMuted ? "Unmute notifications" : "Mute notifications"}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl border transition-colors disabled:opacity-50",
              isMuted
                ? "border-rose-200 bg-rose-50 text-rose-600"
                : "border-slate-200 text-slate-500 hover:bg-slate-50"
            )}
          >
            {isMuted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          </button>
          <button
            onClick={() => run(clearChat)}
            disabled={busy}
            title="Clear messages for me"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <Eraser className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="slim-scroll h-[520px] space-y-1 overflow-y-auto bg-slate-50/60 px-5 py-4">
        {visible.length === 0 && (
          <p className="py-16 text-center text-sm text-slate-400">
            {search ? "No messages match your search." : "No messages yet."}
          </p>
        )}
        {visible.map((m, i) => {
          const day = dividerFor(i);
          return (
            <div key={m.id}>
              {day && (
                <div className="my-4 flex items-center justify-center">
                  <span className="rounded-full bg-white px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 shadow-sm">
                    {day}
                  </span>
                </div>
              )}
              <div className={cn("group flex items-end gap-2", m.isMine && "flex-row-reverse")}>
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                    m.isMine ? "bg-accent-600" : "bg-brand-700"
                  )}
                >
                  {(m.senderName || "?").charAt(0).toUpperCase()}
                </div>
                <div className={cn("max-w-[72%]", m.isMine && "text-right")}>
                  <div
                    className={cn(
                      "inline-block rounded-2xl px-4 py-2.5 text-left text-sm shadow-sm",
                      m.isMine
                        ? "rounded-br-sm bg-gradient-to-r from-brand-700 to-accent-700 text-white"
                        : "rounded-bl-sm bg-white text-slate-800 ring-1 ring-slate-100"
                    )}
                  >
                    {!m.isMine && (
                      <p className="mb-0.5 text-[11px] font-bold text-brand-800">{m.senderName}</p>
                    )}
                    {editingId === m.id ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const text = editContent.trim();
                          if (!text) return;
                          run(async () => {
                            await updateChatMessage(m.id, text);
                            setMessages((prev) =>
                              prev.map((x) => (x.id === m.id ? { ...x, content: text } : x))
                            );
                            setEditingId(null);
                          });
                        }}
                        className="flex items-center gap-2"
                      >
                        <input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="submit"
                          title="Save"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-brand-700 hover:bg-brand-50"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          title="Cancel"
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    ) : (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    )}
                  </div>
                  <p
                    className={cn(
                      "mt-1 flex items-center gap-1.5 text-[10px] text-slate-400",
                      m.isMine && "justify-end"
                    )}
                  >
                    {timeLabel(m.timestamp)}
                    {m.isFavorite && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex shrink-0 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100",
                    m.isMine && "items-end"
                  )}
                >
                  <button
                    onClick={() =>
                      run(async () => {
                        const fav = await toggleChatFavorite(m.id);
                        setMessages((prev) =>
                          prev.map((x) => (x.id === m.id ? { ...x, isFavorite: fav } : x))
                        );
                      })
                    }
                    title={m.isFavorite ? "Unfavorite" : "Favorite"}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg border transition-colors",
                      m.isFavorite
                        ? "border-amber-200 bg-amber-50 text-amber-500"
                        : "border-slate-200 bg-white text-slate-400 hover:text-amber-500"
                    )}
                  >
                    <Star className={cn("h-3.5 w-3.5", m.isFavorite && "fill-amber-400")} />
                  </button>
                  {m.isMine && (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(m.id);
                          setEditContent(m.content);
                        }}
                        title="Edit"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:text-brand-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          run(async () => {
                            await deleteChatMessage(m.id);
                            setMessages((prev) => prev.filter((x) => x.id !== m.id));
                          })
                        }
                        title="Delete"
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:text-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form ref={formRef} action={formAction} className="border-t border-slate-100 bg-white px-5 py-4">
        <div className="flex items-end gap-3">
          <textarea
            name="content"
            rows={1}
            placeholder="Type a message…"
            className="input max-h-28 min-h-[44px] flex-1 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                (e.currentTarget.form as HTMLFormElement).requestSubmit();
              }
            }}
          />
          <button
            type="submit"
            disabled={pending}
            className="btn-primary !px-5"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        {state.error && <p className="mt-2 text-xs text-red-600">{state.error}</p>}
        <p className="mt-2 text-[11px] text-slate-400">
          Enter to send · Shift+Enter for a new line · Messages are visible to all doctors in the group
        </p>
      </form>
    </div>
  );
}
