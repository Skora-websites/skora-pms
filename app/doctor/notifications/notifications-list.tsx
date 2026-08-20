"use client";

import { useTransition } from "react";
import Link from "next/link";
import { CheckCheck } from "lucide-react";
import { markAsRead, markAllAsRead } from "./actions";
import { cn } from "@/lib/utils";

type Item = {
  id: number;
  title: string;
  message: string | null;
  type: string | null;
  link: string | null;
  read: boolean | null;
  createdAtLabel: string;
};

const TYPE_DOT: Record<string, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  info: "bg-brand-500",
};

export function NotificationsList({ notifications }: { notifications: Item[] }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(async () => { await markAllAsRead(); })}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <CheckCheck className="h-3.5 w-3.5" />
          Mark all as read
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <NotificationRow key={n.id} item={n} />
        ))}
      </div>
    </div>
  );
}

function NotificationRow({ item }: { item: Item }) {
  const [isPending, startTransition] = useTransition();

  const title = item.link ? (
    <Link
      href={item.link}
      onClick={() => { if (!item.read) startTransition(async () => { await markAsRead(item.id); }); }}
      className={cn("text-sm font-semibold hover:underline", item.read ? "text-slate-600" : "text-slate-900")}
    >
      {item.title}
    </Link>
  ) : (
    <p className={cn("text-sm font-semibold", item.read ? "text-slate-600" : "text-slate-900")}>
      {item.title}
    </p>
  );

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4 transition",
        item.read
          ? "border-slate-100 bg-white"
          : "border-brand-200 bg-brand-50/60"
      )}
    >
      <span
        className={cn(
          "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
          TYPE_DOT[item.type ?? "info"] ?? TYPE_DOT.info
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          {title}
          {!item.read && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(async () => { await markAsRead(item.id); })}
              className="shrink-0 text-xs font-medium text-brand-700 hover:underline disabled:opacity-50"
            >
              Mark read
            </button>
          )}
        </div>
        {item.message && (
          <p className="mt-0.5 text-sm text-slate-500">{item.message}</p>
        )}
        <p className="mt-1 text-xs text-slate-400">{item.createdAtLabel}</p>
      </div>
    </div>
  );
}