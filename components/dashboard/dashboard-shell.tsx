"use client";

import { useState } from "react";
import { Sidebar, type NavItem } from "./sidebar";
import { DashboardHeader } from "./header";
import { MobileAppShell } from "./mobile-app-shell";
import { PermissionNudge } from "@/components/pwa/permission-nudge";

export function DashboardShell({
  navItems,
  user,
  unreadCount,
  footerHref,
  footerLabel,
  searchHref,
  promo = false,
  children,
}: {
  navItems: NavItem[];
  user: { name: string; role: string; email: string | null; profilePhotoPath: string | null };
  unreadCount?: number;
  footerHref: string;
  footerLabel: string;
  /** Where the top-bar global search routes its query (e.g. /doctor/patients). */
  searchHref?: string;
  /** Show the sidebar "Download Doctor App" promo card (doctor shell only). */
  promo?: boolean;
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

      {/* Fixed sidebar (its <aside>s self-gate visibility at the lg breakpoint;
          the drawer is lg:hidden so it never appears on desktop). */}
      <Sidebar
        items={navItems}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        footerHref={footerHref}
        footerLabel={footerLabel}
        promo={promo}
      />

      {/* Content column: header + main share the sidebar offset so the
          header starts after the sidebar (never under it) and the sticky
          header has a full-height parent to stick within. */}
      <div
        className={`transition-all duration-300 ${
          collapsed ? "lg:pl-[76px]" : "lg:pl-64"
        }`}
      >
        <DashboardHeader user={user} unreadCount={unreadCount} onOpenMobileMenu={() => setMobileOpen(true)} searchHref={searchHref} />
        {/* Single page content — never duplicated. Mobile: gutters + bottom
            tab bar clearance. Desktop: top padding below the in-flow header. */}
        <main className="overflow-x-hidden px-4 pb-24 pt-14 lg:px-8 lg:pb-8 lg:pt-6">
          {children}
        </main>
      </div>

      {/* Post-login permissions (notifications + location) — once per
          browser, dismissed state remembered. */}
      <PermissionNudge />
    </div>
  );
}
