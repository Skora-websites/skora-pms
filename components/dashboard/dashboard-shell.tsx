"use client";

import { useState } from "react";
import { Sidebar, type NavItem } from "./sidebar";
import { DashboardHeader } from "./header";
import { MobileChrome } from "./mobile-app-shell";

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
    <div className="min-h-screen bg-slate-50">
      {/* Chrome — mobile app bar + bottom tabs (visible on < lg only). */}
      <MobileChrome navItems={navItems} user={user} unreadCount={unreadCount} />

      {/* Chrome — desktop sidebar (visible on >= lg only). */}
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
      </div>

      {/* Content — rendered ONCE, shared by both breakpoints. */}
      <div className="lg:pl-64">
        {/* Desktop header sits above the content on >= lg; hidden on mobile
            (the mobile app bar renders instead). */}
        <div className="hidden lg:block">
          <DashboardHeader user={user} unreadCount={unreadCount} onOpenMobileMenu={() => setMobileOpen(true)} />
        </div>
        <main className="px-4 py-4 pb-24 lg:p-8 lg:pb-8">{children}</main>
      </div>
    </div>
  );
}
