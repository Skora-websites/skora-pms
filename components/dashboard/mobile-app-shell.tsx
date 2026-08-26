"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Grid2x2, LogOut, Menu, UserRound, X } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { initials, cn } from "@/lib/utils";
import { ICON_MAP, type NavItem } from "./sidebar";

/**
 * Mobile app shell (lg:hidden only).
 *
 * Bottom tab bar: up to 5 primary destinations + a "More" sheet with every
 * remaining module in a grid. Slim top app bar: hamburger (full nav),
 * page title, notification bell, profile → logout.
 *
 * Desktop (>= lg) is untouched — the sidebar layout renders instead.
 */
export function MobileAppShell({
  navItems,
  user,
  unreadCount = 0,
  footerLabel,
  children,
}: {
  navItems: NavItem[];
  user: { name: string; role: string; email: string | null; profilePhotoPath: string | null };
  unreadCount?: number;
  footerLabel: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Pick 4 primary tabs by priority, per role.
  const primary = pickPrimary(navItems, user.role);
  const moreItems = navItems.filter((n) => !primary.some((p) => p.href === n.href));

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  const closeAll = () => {
    setMoreOpen(false);
    setDrawerOpen(false);
    setProfileOpen(false);
  };

  // Close sheets on outside tap.
  useEffect(() => {
    if (!moreOpen && !profileOpen && !drawerOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const el = e.target as HTMLElement;
      if (sheetRef.current && !sheetRef.current.contains(el)) closeAll();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [moreOpen, profileOpen, drawerOpen]);

  const pageTitle =
    navItems.find((i) => isActive(i.href))?.label ??
    (user.role === "patient" ? "My Care" : footerLabel);

  return (
    <div className="min-h-dvh bg-surface lg:hidden">
      {/* ── Top app bar ── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-1.5 px-3">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 active:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="truncate font-display text-[15px] font-bold text-ink">{pageTitle}</span>
          <div className="ml-auto flex items-center gap-1">
            {user.role !== "patient" && user.role !== "super_admin" && (
              <Link
                href="/doctor/notifications"
                aria-label="Notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 active:bg-slate-100"
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
                <p className="truncate font-display text-sm font-bold text-ink">{user.name}</p>
                <p className="truncate text-xs capitalize text-ink-muted">{user.role.replace("_", " ")}</p>
              </div>
              <button onClick={closeAll} className="rounded-lg p-1.5 text-slate-400" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-3 space-y-1">
              <Link
                href={user.role === "super_admin" ? "/super-admin/settings" : user.role === "patient" ? "/patient" : "/doctor/profile"}
                onClick={closeAll}
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

      {/* ── Full drawer nav ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={closeAll} />
          <div ref={sheetRef} className="absolute inset-y-0 left-0 flex w-[80%] max-w-xs flex-col bg-navy-950 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-4">
              <span className="font-display text-base font-extrabold text-white">SkoraCares</span>
              <button onClick={closeAll} className="rounded-lg p-1.5 text-white/60 hover:text-white" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="slim-scroll flex-1 space-y-0.5 overflow-y-auto px-2 pb-6">
              {navItems.map((item) => {
                const active = isActive(item.href);
                const Icon = ICON_MAP[item.icon] ?? Grid2x2;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeAll}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-gradient-to-r from-brand-700 to-accent-700 text-white"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Icon className={cn("h-5 w-5 flex-shrink-0", active ? "text-white" : "text-white/40")} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-white/10 p-3">
              <p className="px-3 py-2 text-xs text-white/40">{footerLabel}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Page content (pb for tab bar) ── */}
      <main className="pb-24">{children}</main>

      {/* ── Bottom tab bar ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/70 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-stretch justify-around px-1">
          {primary.map((item) => {
            const active = isActive(item.href);
            const Icon = ICON_MAP[item.icon] ?? Grid2x2;
            return (
              <Link key={item.href} href={item.href} className="flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2">
                <span className="relative flex h-7 w-12 items-center justify-center">
                  {active && (
                    <span className="absolute inset-x-1 top-0 h-0.5 rounded-full bg-accent-400" />
                  )}
                  <Icon className={cn("h-[22px] w-[22px]", active ? "text-brand-700" : "text-slate-400")} />
                </span>
                <span className={cn("max-w-full truncate text-[10px] font-semibold", active ? "text-brand-800" : "text-slate-400")}>
                  {shortLabel(item.label)}
                </span>
              </Link>
            );
          })}
          {moreItems.length > 0 && (
            <button
              onClick={() => setMoreOpen(true)}
              className="flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2"
              aria-label="More"
            >
              <span className="relative flex h-7 w-12 items-center justify-center">
                {moreOpen && <span className="absolute inset-x-1 top-0 h-0.5 rounded-full bg-accent-400" />}
                <Grid2x2 className={cn("h-[22px] w-[22px]", moreOpen ? "text-brand-700" : "text-slate-400")} />
              </span>
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
              <p className="font-display text-sm font-bold text-ink">All modules</p>
              <button onClick={closeAll} className="rounded-lg p-1.5 text-slate-400" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid max-h-[50vh] grid-cols-4 gap-1 overflow-y-auto pb-3 pt-2">
              {[...moreItems, ...primary].map((item) => {
                const active = isActive(item.href);
                const Icon = ICON_MAP[item.icon] ?? Grid2x2;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeAll}
                    className={cn("flex flex-col items-center gap-1 rounded-2xl px-2 py-3", active ? "bg-brand-50" : "active:bg-slate-50")}
                  >
                    <Icon className={cn("h-6 w-6", active ? "text-brand-800" : "text-slate-400")} />
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

/** Role-aware primary tabs (max 4) — the destinations used most on the go. */
function pickPrimary(items: NavItem[], role: string): NavItem[] {
  const order: Record<string, string[]> = {
    doctor: ["/doctor", "/doctor/appointments", "/doctor/billing", "/doctor/patients"],
    receptionist: ["/doctor", "/doctor/appointments", "/doctor/billing", "/doctor/patients"],
    admin: ["/doctor", "/doctor/appointments", "/doctor/billing", "/doctor/patients"],
    patient: ["/patient", "/patient/appointments", "/patient/prescriptions", "/patient/find-doctor"],
    super_admin: ["/super-admin", "/super-admin/doctors", "/super-admin/users", "/super-admin/clinics"],
  };
  const wanted = order[role] ?? order.doctor!;
  const picked: NavItem[] = [];
  for (const href of wanted) {
    const found = items.find((i) => i.href === href);
    if (found) picked.push(found);
  }
  // Fill remaining slots with the first unselected items.
  for (const item of items) {
    if (picked.length >= 4) break;
    if (!picked.some((p) => p.href === item.href)) picked.push(item);
  }
  return picked.slice(0, 4);
}

/** Shorten long labels for the tab bar (e.g. "Income & Expense" → "Income"). */
function shortLabel(label: string): string {
  const map: Record<string, string> = {
    "Income & Expense": "Income",
    "Test Booking": "Tests",
    "Home Visit": "Visits",
    "Manage Doctors": "Doctors",
    "Manage Clinics": "Clinics",
    "Manage Users": "Users",
    "My Health Records": "Records",
    "Find a Doctor": "Find",
  };
  return map[label] ?? label;
}
