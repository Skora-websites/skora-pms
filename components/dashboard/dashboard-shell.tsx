"use client";

import { useState } from "react";
import { Sidebar, type NavItem } from "./sidebar";
import { DashboardHeader } from "./header";
import { MobileAppShell } from "./mobile-app-shell";

export function DashboardShell({
  navItems,
  user,
  unreadCount,
  footerHref,
  footerLabel,
  children,
}: {
  navItems: NavItem[];
  user: { name: string; role: string; email: string | null; profilePhotoPath: string | null };
  unreadCount?: number;
  footerHref: string;
  footerLabel: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface">
      {/* Mobile app shell (< lg) — chrome only; page content is rendered ONCE
          in the shared <main> below, so the DOM never duplicates IDs/forms. */}
      <div className="lg:hidden">
        <MobileAppShell navItems={navItems} user={user} unreadCount={unreadCount} footerLabel={footerLabel} />
      </div>

      {/* Desktop chrome (>= lg): fixed sidebar + sticky header in-flow.
          The fixed sidebar overlays the left edge, so <main> gets the offset. */}
      <div className="hidden lg:block">
        <Sidebar
          items={navItems}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((v) => !v)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          footerHref={footerHref}
          footerLabel={footerLabel}
        />
        <div>
          <DashboardHeader user={user} unreadCount={unreadCount} onOpenMobileMenu={() => setMobileOpen(true)} />
        </div>
      </div>

      {/* Single page content — never duplicated. Mobile: gutters + bottom tab
          bar clearance. Desktop: offset for the fixed sidebar. */}
      <main
        className={`overflow-x-hidden px-4 pb-24 pt-14 transition-all duration-300 lg:px-8 lg:pb-8 lg:pt-6 ${
          collapsed ? "lg:pl-[76px]" : "lg:pl-64"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
