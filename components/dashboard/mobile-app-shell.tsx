"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Grid2x2, LogOut, UserRound, X } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { initials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { ICON_MAP, type NavItem } from "./sidebar";

/**
 * Native-app-style MOBILE CHROME for the SkoraCare dashboards.
 *
 * Renders ONLY the mobile app bar (title + notifications + profile) and the
 * fixed bottom tab bar (4 primary + "More" sheet). The page content is
 * rendered once by the parent DashboardShell — this component never wraps
 * children, so no double-mounting of page state/effects.
 *
 * Visible on < lg only; the desktop sidebar takes over on >= lg.
 */
export function MobileChrome({
  navItems,
  user,
  unreadCount = 0,
}: {
  navItems: NavItem[];
  user: { name: string; role: string; email: string | null; profilePhotoPath: string | null };
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Primary tabs: pick the first 4 meaningful destinations.
  const primary = navItems.slice(0, 4);
  const moreItems = navItems.slice(4);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  const closeSheets = () => {
    setMoreOpen(false);
    setProfileOpen(false);
  };

  useEffect(() => {
    if (!moreOpen && !profileOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const el = e.target as HTMLElement;
      if (sheetRef.current && !sheetRef.current.contains(el)) {
        closeSheets();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [moreOpen, profileOpen]);

  // Bottom padding so content isn't hidden behind the fixed tab bar.
  const pageTitle =
    [...primary, ...moreItems].find((i) => isActive(i.href))?.label ?? "SkoraCare";

  return (
    <div className="min-h-dvh bg-slate-50 lg:hidden">
      {/* ── App bar (mobile) ── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-3 px-4">
          <span className="font-display text-base font-extrabold text-slate-900">
            {pageTitle}
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            {user.role !== "patient" && user.role !== "super_admin" && (
              <Link
                href="/doctor/notifications"
                aria-label="Notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 active:bg-slate-100"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={() => setProfileOpen((v) => !v)}
              aria-label="Profile"
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-700 to-accent-600 text-xs font-bold text-white"
            >
              {user.profilePhotoPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/api/doctor/profile/photo" alt={user.name} className="h-full w-full object-cover" />
              ) : (
                initials(user.name)
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Profile sheet ── */}
      {profileOpen && (
        <div ref={sheetRef} className="fixed inset-x-0 top-0 z-50">
          <div className="mx-auto max-w-md rounded-b-3xl bg-white p-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-accent-600 text-sm font-bold text-white">
                {user.profilePhotoPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/api/doctor/profile/photo" alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  initials(user.name)
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-bold text-slate-900">{user.name}</p>
                <p className="truncate text-xs capitalize text-slate-400">{user.role.replace("_", " ")}</p>
              </div>
              <button onClick={() => setProfileOpen(false)} className="rounded-lg p-1.5 text-slate-400" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-3 space-y-1">
              <Link
                href={user.role === "super_admin" ? "/super-admin/settings" : user.role === "patient" ? "/patient" : "/doctor/profile"}
                onClick={closeSheets}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 active:bg-slate-50"
              >
                <UserRound className="h-4 w-4" /> Profile
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 active:bg-red-50">
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom tab bar (mobile) ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-stretch justify-around px-2">
          {primary.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2.5"
              >
                <IconFor item={item} active={active} />
                <span
                  className={cn(
                    "max-w-full truncate text-[10px] font-semibold",
                    active ? "text-brand-800" : "text-slate-400"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
          {moreItems.length > 0 && (
            <button
              onClick={() => setMoreOpen(true)}
              className="flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2.5"
            >
              <Grid2x2 className={cn("h-6 w-6", moreOpen ? "text-brand-800" : "text-slate-400")} />
              <span className="max-w-full truncate text-[10px] font-semibold text-slate-400">More</span>
            </button>
          )}
        </div>
      </nav>

      {/* ── More sheet ── */}
      {moreOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50" ref={sheetRef}>
          <div className="mx-auto max-w-md rounded-t-3xl bg-white px-4 pb-[env(safe-area-inset-bottom)] pt-3 shadow-2xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />
            <div className="flex items-center justify-between px-1">
              <p className="font-display text-sm font-bold text-slate-900">All</p>
              <button onClick={() => setMoreOpen(false)} className="rounded-lg p-1.5 text-slate-400" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid max-h-[50vh] grid-cols-4 gap-1 overflow-y-auto pb-3 pt-2">
              {[...moreItems, ...primary].map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeSheets}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-2xl px-2 py-3",
                      active ? "bg-brand-50" : "active:bg-slate-50"
                    )}
                  >
                    <IconFor item={item} active={active} />
                    <span className={cn("w-full truncate text-center text-[10px] font-semibold", active ? "text-brand-800" : "text-slate-500")}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Resolve a lucide icon from the shared icon key (grid fallback). */
function IconFor({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = ICON_MAP[item.icon] ?? Grid2x2;
  return <Icon className={cn("h-6 w-6", active ? "text-brand-800" : "text-slate-400")} />;
}
