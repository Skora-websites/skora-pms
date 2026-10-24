"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Grid2x2, LogOut, UserRound, X } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { initials, cn } from "@/lib/utils";
import { ICON_MAP, type NavItem } from "./sidebar";
import { normalizeShell, notificationsPath, profilePath } from "@/lib/auth/shell-paths";

/**
 * Mobile app shell (lg:hidden only).
 *
 * Bottom tab bar: up to 5 primary destinations + a "More" sheet with every
 * remaining module in a grid. Slim top app bar: page title, notification
 * bell, profile → logout.
 *
 * Desktop (>= lg) is untouched — the sidebar layout renders instead.
 */
export function MobileAppShell({
  navItems,
  user,
  unreadCount = 0,
  footerLabel,
}: {
  navItems: NavItem[];
  user: { name: string; role: string; email: string | null; profilePhotoPath: string | null };
  unreadCount?: number;
  footerLabel: string;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Pick 4 primary tabs by priority, per shell.
  const primary = pickPrimary(navItems, user.role);
  const moreItems = navItems.filter((n) => !primary.some((p) => p.href === n.href));

  // Links that must resolve inside the caller's own panel — see shell-paths.ts.
  const shell = normalizeShell(user.role);
  const notificationsHref = notificationsPath(shell);
  const profileHref = profilePath(shell);

  // Same semantics as the sidebar: `exact` items must match the pathname
  // exactly, otherwise the prefix match would highlight "Dashboard" on every
  // /patient/* route (two active tabs + a stale app-bar title).
  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const closeAll = () => {
    setMoreOpen(false);
    setProfileOpen(false);
  };

  // Close sheets on outside tap.
  useEffect(() => {
    if (!moreOpen && !profileOpen) return;
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
  }, [moreOpen, profileOpen]);

  const pageTitle =
    navItems.find((i) => isActive(i.href, i.exact))?.label ??
    (user.role === "patient" ? "My Care" : footerLabel);

  // iOS-style large-title collapse: at the top of the page the H1 sits right
  // under the bar, so the bar title hides (no duplicated heading); it fades
  // in once the content scrolls under it.
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="lg:hidden">
      {/* ── Top app bar ── */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200/70 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="flex h-14 items-center gap-1.5 px-3">
          <span
            className={cn(
              "truncate font-display text-[15px] font-bold text-ink transition-opacity duration-200",
              scrolled ? "opacity-100" : "opacity-0"
            )}
          >
            {pageTitle}
          </span>
          <div className="ml-auto flex items-center gap-1">
            {notificationsHref && (
              <Link
                href={notificationsHref}
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
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-brand-700 text-xs font-bold text-white"
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
              <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-brand-700 text-sm font-bold text-white">
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
              {profileHref && (
                <Link
                  href={profileHref}
                  onClick={closeAll}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 active:bg-slate-50"
                >
                  <UserRound className="h-4 w-4" /> Profile
                </Link>
              )}
              <form action={logoutAction}>
                <button type="submit" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 active:bg-red-50">
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom tab bar — floating rounded app-nav ── */}
      <nav className="fixed inset-x-3 z-40 bottom-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-md items-stretch justify-around rounded-[26px] border border-slate-200/60 bg-white/90 px-1 shadow-float backdrop-blur-xl">
          {primary.map((item) => {
            const active = isActive(item.href, item.exact);
            const Icon = ICON_MAP[item.icon] ?? Grid2x2;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[20px] py-2.5 transition-transform active:scale-95"
              >
                <span className="relative flex h-8 w-12 items-center justify-center">
                  {active && <span className="absolute inset-0 rounded-full bg-accent-100" />}
                  <Icon
                    className={cn(
                      "relative h-[22px] w-[22px] transition-colors",
                      active ? "text-brand-800" : "text-slate-400 group-active:text-slate-500"
                    )}
                  />
                </span>
                <span className={cn("max-w-full truncate text-[11px] font-semibold", active ? "text-brand-800" : "text-slate-500")}>
                  {shortLabel(item.label)}
                </span>
              </Link>
            );
          })}
          {moreItems.length > 0 && (
            <button
              onClick={() => setMoreOpen(true)}
              className="group flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[20px] py-2.5 transition-transform active:scale-95"
              aria-label="More"
            >
              <span className="relative flex h-8 w-12 items-center justify-center">
                {moreOpen && <span className="absolute inset-0 rounded-full bg-accent-100" />}
                <Grid2x2
                  className={cn(
                    "relative h-[22px] w-[22px] transition-colors",
                    moreOpen ? "text-brand-800" : "text-slate-400 group-active:text-slate-500"
                  )}
                />
              </span>
              <span className={cn("max-w-full truncate text-[11px] font-semibold", moreOpen ? "text-brand-800" : "text-slate-500")}>
                More
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* ── More sheet ── */}
      {moreOpen && (
        <div className="fixed inset-x-0 bottom-0 z-50" ref={sheetRef}>
          <div className="mx-auto max-w-md rounded-t-3xl bg-white px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-3 shadow-2xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200" />
            <div className="flex items-center justify-between px-1">
              <p className="font-display text-sm font-bold text-ink">All modules</p>
              <button onClick={closeAll} className="rounded-lg p-1.5 text-slate-400" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid max-h-[50vh] grid-cols-4 gap-1 overflow-y-auto pb-3 pt-2">
              {[...moreItems, ...primary].map((item) => {
                const active = isActive(item.href, item.exact);
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
  // Keys are the caller's SHELL, not the raw `user.role` string: the admin
  // shell passes "Business Owner"/"Clinic Manager" and the super-admin shell
  // passes "PMS Admin", so a role-keyed lookup fell through to the doctor
  // default and produced tabs pointing at /doctor/* for owners (audit M10).
  const shell = normalizeShell(role);
  const order: Record<string, string[]> = {
    doctor: ["/doctor", "/doctor/appointments", "/doctor/billing", "/doctor/patients"],
    receptionist: ["/receptionist", "/receptionist/appointments", "/receptionist/patients", "/receptionist/schedule"],
    admin: ["/admin", "/admin/appointments", "/admin/billing", "/admin/patients"],
    patient: ["/patient", "/patient/appointments", "/patient/prescriptions", "/patient/find-doctor"],
    super_admin: ["/super-admin", "/super-admin/doctors", "/super-admin/users", "/super-admin/clinics"],
  };
  const wanted = order[shell] ?? order.doctor!;
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
    // The floating rounded bar is ~73px/tab at 11px — anything longer
    // ellipsizes, so the two frequent ones get terse tab-bar equivalents.
    Appointments: "Visits",
    Registrations: "Patients",
    "Schedule Time": "Schedule",
  };
  return map[label] ?? label;
}
