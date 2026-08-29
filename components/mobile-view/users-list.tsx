"use client";

import { Pencil, UserCheck, UserX } from "lucide-react";
import { StatusBadge } from "@/components/ui/dashboard-ui";
import { formatDate, initials } from "@/lib/utils";

type UserRow = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string | null;
};

/**
 * Mobile-only user list (< sm, hidden ≥ sm) for the super-admin users page.
 * One card per user — no table scroll.
 */
export function UsersList({
  users,
  currentUserId,
  onEdit,
  onToggle,
  toggling,
}: {
  users: UserRow[];
  currentUserId: number;
  onEdit: (u: UserRow) => void;
  onToggle: (u: UserRow) => void;
  toggling: number | null;
}) {
  return (
    <div className="space-y-3 sm:hidden">
      {users.map((u) => (
        <div key={u.id} className="card p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-navy-800 to-brand-700 text-xs font-bold text-white">
                {initials(u.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {u.name}
                  {u.id === currentUserId && <span className="ml-1.5 text-xs font-medium text-brand-700">(you)</span>}
                </p>
                <p className="truncate text-xs text-slate-400">{u.email ?? "—"}</p>
              </div>
            </div>
            <StatusBadge status={u.status} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-slate-400">Role</p>
              <p className="badge bg-slate-100 capitalize text-slate-700">{u.role.replace(/_/g, " ")}</p>
            </div>
            <div>
              <p className="text-slate-400">Phone</p>
              <p className="font-medium text-slate-700">{u.phone ?? "—"}</p>
            </div>
            <div>
              <p className="text-slate-400">Joined</p>
              <p className="font-medium text-slate-700">{formatDate(u.createdAt)}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => onEdit(u)}
              className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:border-brand-300 hover:text-brand-800"
              aria-label={`Edit ${u.name}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
            {u.id !== currentUserId && u.role !== "super_admin" && (
              <button
                type="button"
                onClick={() => onToggle(u)}
                disabled={toggling === u.id}
                className={`rounded-lg border p-2 transition-colors disabled:opacity-50 ${
                  u.status === "active"
                    ? "border-red-200 text-red-600 hover:bg-red-50"
                    : "border-accent-200 text-accent-700 hover:bg-accent-50"
                }`}
                aria-label={u.status === "active" ? `Deactivate ${u.name}` : `Activate ${u.name}`}
              >
                {u.status === "active" ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
