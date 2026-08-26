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
      {/* Mobile app shell (< lg) */}
      <MobileAppShell navItems={navItems} user={user} unreadCount={unreadCount} footerLabel={footerLabel}>
        {children}
      </MobileAppShell>

      {/* Desktop sidebar (>= lg) */}
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
        <div className={`transition-all duration-300 ${collapsed ? "lg:pl-[76px]" : "lg:pl-64"}`}>
          <DashboardHeader user={user} unreadCount={unreadCount} onOpenMobileMenu={() => setMobileOpen(true)} />
          <main className="p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
