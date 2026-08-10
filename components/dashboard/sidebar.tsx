"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronsLeft,
  X,
  LayoutDashboard,
  CalendarClock,
  UserPlus,
  CalendarDays,
  PhoneCall,
  Wallet,
  TestTube2,
  Calculator,
  Headset,
  Users,
  UserCog,
  FileHeart,
  Building2,
  ClipboardList,
  Newspaper,
  PanelsTopLeft,
  Mail,
  MessagesSquare,
  Home,
  ShoppingCart,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/marketing/logo";

const ICON_MAP: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  "calendar-clock": CalendarClock,
  "user-plus": UserPlus,
  "calendar-days": CalendarDays,
  "phone-call": PhoneCall,
  wallet: Wallet,
  "test-tube": TestTube2,
  calculator: Calculator,
  headset: Headset,
  users: Users,
  "user-cog": UserCog,
  "file-heart": FileHeart,
  "building-2": Building2,
  "clipboard-list": ClipboardList,
  newspaper: Newspaper,
  "panels-top-left": PanelsTopLeft,
  mail: Mail,
  "messages-square": MessagesSquare,
  home: Home,
  "shopping-cart": ShoppingCart,
  "file-text": FileText,
};

export type NavItem = {
  label: string;
  href: string;
  /** Icon key resolved via ICON_MAP inside the client component. */
  icon: string;
  exact?: boolean;
};

export function Sidebar({
  items,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
  footerHref,
  footerLabel,
}: {
  items: NavItem[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  footerHref: string;
  footerLabel: string;
}) {
  const pathname = usePathname();

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");

  const nav = (
    <div className="flex h-full flex-col">
      <div className={cn("flex items-center justify-between px-4 py-5", collapsed && "justify-center px-2")}>
        <div onClick={onCloseMobile} className="cursor-pointer">
          <Logo />
        </div>
        <button
          onClick={onToggleCollapsed}
          className={cn(
            "hidden h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white lg:flex",
            collapsed && "lg:hidden"
          )}
          aria-label="Collapse sidebar"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          onClick={onCloseMobile}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="slim-scroll flex-1 space-y-1 overflow-y-auto px-3 pb-6">
        {items.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                collapsed ? "justify-center px-0" : "",
                active
                  ? "bg-gradient-to-r from-brand-700 to-accent-700 text-white shadow-lg shadow-brand-900/30"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon name={item.icon} className={cn("h-5 w-5 flex-shrink-0", active ? "text-white" : "text-white/40 group-hover:text-white/70")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link
          href={footerHref}
          target={footerHref.startsWith("http") ? "_blank" : undefined}
          onClick={onCloseMobile}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white",
            collapsed && "justify-center px-0"
          )}
          title={collapsed ? footerLabel : undefined}
        >
          <GlobeIcon className="h-5 w-5 text-white/40" />
          {!collapsed && <span>{footerLabel}</span>}
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden bg-navy-950 transition-all duration-300 lg:block",
          collapsed ? "w-[76px]" : "w-64"
        )}
      >
        {nav}
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onCloseMobile}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-navy-950 transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {nav}
      </aside>
    </>
  );
}

function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = ICON_MAP[name] ?? LayoutDashboard;
  return <Cmp className={className} />;
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
