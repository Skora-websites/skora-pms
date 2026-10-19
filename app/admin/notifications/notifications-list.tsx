"use client";

import { useTransition } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { markAdminNotificationRead, type AdminNotifRow } from "./actions";

const TYPE_DOT: Record<string, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-red-500",
  info: "bg-brand-500",
};

function relativeTime(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function NotificationsList({ notifications }: { notifications: AdminNotifRow[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <ul className="space-y-2">
      {notifications.map((n) => (
        <li
          key={n.id}
          className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4"
        >
          <span
            className={`mt-1 h-2 w-2 shrink-0 rounded-full ${TYPE_DOT[n.type ?? ""] ?? "bg-slate-300"}`}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">{n.title}</p>
            {n.message && <p className="mt-0.5 text-xs text-ink-muted">{n.message}</p>}
            <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
              {relativeTime(n.createdAt)}
            </p>
          </div>
          {!n.read && (
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => void markAdminNotificationRead(n.id))}
              className="shrink-0 rounded-lg border border-slate-200 p-2 text-slate-500 hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
              aria-label="Mark as read"
            >
              <CheckCheck className="h-4 w-4" />
            </button>
          )}
          {n.read && <Bell className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />}
        </li>
      ))}
    </ul>
  );
}
