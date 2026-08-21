"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Bell, LogOut, UserRound, ChevronDown } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { initials } from "@/lib/utils";

export function DashboardHeader({
  user,
  unreadCount = 0,
  onOpenMobileMenu,
}: {
  user: { name: string; role: string; email: string | null; profilePhotoPath: string | null };
  unreadCount?: number;
  onOpenMobileMenu: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        <button
          onClick={onOpenMobileMenu}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden text-sm text-slate-400 lg:block">
          <span className="font-medium text-slate-600">{user.name}</span>
          <span className="mx-2">/</span>
          <span className="capitalize">{user.role.replace("_", " ")}</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Notifications — doctor/staff only; patients and super-admins have no notification inbox */}
          {user.role !== "patient" && user.role !== "super_admin" && (
            <div className="relative">
              <Link
                href="/doctor/notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            </div>
          )}

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 rounded-xl border border-slate-200 py-1.5 pl-1.5 pr-3 transition-colors hover:bg-slate-50"
            >
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-brand-700 to-accent-600 text-xs font-bold text-white">
                {user.profilePhotoPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src="/api/doctor/profile/photo"
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials(user.name)
                )}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-semibold leading-tight text-slate-900">
                  {user.name}
                </span>
                <span className="block text-xs capitalize leading-tight text-slate-400">
                  {user.role.replace("_", " ")}
                </span>
              </span>
              <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-12 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                <div className="border-b border-slate-100 px-3 py-2.5">
                  <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                  <p className="truncate text-xs text-slate-400">{user.email}</p>
                </div>
                <Link
                  href={
                    user.role === "super_admin"
                      ? "/super-admin/settings"
                      : user.role === "patient"
                        ? "/patient"
                        : "/doctor/profile"
                  }
                  className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
                >
                  <UserRound className="h-4 w-4" /> Profile settings
                </Link>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" /> Log out
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
