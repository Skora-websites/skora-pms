"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Bell, LogOut, UserRound, ChevronDown, Search, MessageCircle, ShieldCheck } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { initials } from "@/lib/utils";

export function DashboardHeader({
  user,
  unreadCount = 0,
  onOpenMobileMenu,
  searchHref,
  searchPlaceholder = "Search patient by name, phone or email…",
}: {
  user: { name: string; role: string; email: string | null; profilePhotoPath: string | null };
  unreadCount?: number;
  onOpenMobileMenu: () => void;
  searchHref?: string;
  searchPlaceholder?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // ⌘F / Ctrl+F focuses the global search (per DESIGN.md §5.2 shortcut chip).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") {
        if (searchRef.current && document.activeElement !== searchRef.current) {
          e.preventDefault();
          searchRef.current.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const submitSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q");
    if (typeof q === "string" && q.trim() && searchHref) {
      router.push(`${searchHref}?q=${encodeURIComponent(q.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 hidden border-b border-slate-200 bg-surface/80 backdrop-blur-xl lg:block">
      <div className="flex h-17 items-center gap-3 px-4 lg:px-6">
        <button
          onClick={onOpenMobileMenu}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global search (reuses the patients / users search — no new feature) */}
        {searchHref && (
          <form onSubmit={submitSearch} className="hidden min-w-0 flex-1 max-w-xl lg:block">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchRef}
                name="q"
                defaultValue=""
                placeholder={searchPlaceholder}
                className="h-10 w-full rounded-full border border-slate-200 bg-white pl-11 pr-14 text-[13px] text-ink outline-none transition-all placeholder:text-slate-400 focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10"
              />
              <kbd className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
                ⌘F
              </kbd>
            </div>
          </form>
        )}

        {/* Compliance chips (DESIGN.md §5.2) */}
        <div className="hidden shrink-0 items-center gap-2 xl:flex">
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-ink">
            <ShieldCheck className="h-3 w-3 text-brand-700" />
            HIPAA-Grade Security
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-ink">
            🇮🇳 Made in India
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Notifications — doctor/staff only; patients and super-admins have no notification inbox */}
          {user.role !== "patient" && user.role !== "super_admin" && (
            <Link
              href="/doctor/notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:text-ink"
              aria-label="Notifications"
            >
              <Bell className="h-[17px] w-[17px]" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </Link>
          )}

          {/* WhatsApp support shortcut (static wa.me link, per §5.2) */}
          <a
            href="https://wa.me/919217375831"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:text-ink xl:flex"
            aria-label="WhatsApp support"
          >
            <MessageCircle className="h-[17px] w-[17px]" />
          </a>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-3 transition-colors hover:bg-white/60"
            >
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-accent-100 text-[12px] font-bold text-brand-800">
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
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-[13px] font-bold text-ink">
                  {user.name}
                </span>
                <span className="block text-[11px] capitalize leading-tight text-slate-500">
                  {user.role.replace("_", " ")}
                </span>
              </span>
              <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-12 w-60 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                <div className="border-b border-slate-100 px-3 py-2.5">
                  <p className="text-sm font-semibold text-ink">{user.name}</p>
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

          {/* Online status pill (DESIGN.md §5.2) */}
          <span className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-brand-800 xl:inline-flex">
            <span className="text-accent-500">●</span> Online
          </span>
        </div>
      </div>
    </header>
  );
}
