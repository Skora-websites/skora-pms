"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import {
  markPatientNotificationRead,
  markAllPatientNotificationsRead,
  type PatientNotifRow,
} from "./actions";

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

export function PatientNotificationsList({ notifications }: { notifications: PatientNotifRow[] }) {
  const [pending, startTransition] = useTransition();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-3">
      {unread > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => void markAllPatientNotificationsRead())}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all as read ({unread})
          </button>
        </div>
      )}
      <ul className="space-y-2">
        {notifications.map((n) => (
          <li
            key={n.id}
            className={`flex items-start gap-3 rounded-xl border bg-white p-4 ${
              n.read ? "border-slate-200" : "border-brand-200"
            }`}
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
                onClick={() => startTransition(() => void markPatientNotificationRead(n.id))}
                className="shrink-0 rounded-lg border border-slate-200 p-2 text-slate-500 hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
                aria-label="Mark as read"
              >
                <CheckCheck className="h-4 w-4" />
              </button>
            )}
            {n.link && (
              <Link
                href={n.link}
                className="shrink-0 self-center rounded-lg border border-brand-200 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
              >
                View
              </Link>
            )}
            {n.read && !n.link && (
              <Bell className="h-4 w-4 shrink-0 self-center text-slate-300" aria-hidden />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
