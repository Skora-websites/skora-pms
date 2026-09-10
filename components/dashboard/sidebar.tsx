"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronsLeft,
  ChevronsRight,
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
  Bell,
  Video,
  HelpCircle,
  Shield,
  Siren,
  Stethoscope,
  ReceiptText,
  CreditCard,
  Settings,
  Download,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/marketing/logo";

export const ICON_MAP: Record<string, LucideIcon> = {
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
  settings: Settings,
  bell: Bell,
  video: Video,
  "help-circle": HelpCircle,
  shield: Shield,
  siren: Siren,
  stethoscope: Stethoscope,
  receipt: ReceiptText,
  "credit-card": CreditCard,
};

export type NavItem = {
  label: string;
  href: string;
  /** Icon key resolved via ICON_MAP inside the client component. */
  icon: string;
  exact?: boolean;
  /** Optional group caption (e.g. "Clinical modules"). Items sharing a
      section render under one micro-caption header, in encounter order. */
  section?: string;
};

/** Decorative topographic contour lines for dark forest promo surfaces. */
function ContourLines({ className }: { className?: string }) {
  return (
    <svg
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      viewBox="0 0 200 200"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M-10 150 C 40 110, 90 180, 140 140 S 220 120, 240 150" stroke="var(--color-accent-500)" strokeOpacity="0.22" strokeWidth="1.5" />
      <path d="M-10 170 C 50 135, 100 195, 150 160 S 220 145, 240 170" stroke="var(--color-accent-500)" strokeOpacity="0.14" strokeWidth="1.5" />
      <path d="M-10 128 C 45 95, 95 150, 145 118 S 215 100, 240 128" stroke="var(--color-accent-500)" strokeOpacity="0.10" strokeWidth="1.5" />
    </svg>
  );
}

export function Sidebar({
  items,
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
  footerHref,
  footerLabel,
  promo = false,
}: {
  items: NavItem[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  footerHref: string;
  footerLabel: string;
  /** Show the §5.1 "Download Doctor App" promo card (doctor shell only). */
  promo?: boolean;
}) {
  const pathname = usePathname();

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");

  /** Group consecutive items by their section caption, preserving order. */
  function groupItems(items: NavItem[]): [string | undefined, NavItem[]][] {
    const groups: [string | undefined, NavItem[]][] = [];
    for (const item of items) {
      const last = groups[groups.length - 1];
      if (last && last[0] === item.section) last[1].push(item);
      else groups.push([item.section, [item]]);
    }
    return groups;
  }

  const nav = (
    <div className="flex h-full flex-col">
      <div className={cn("flex items-center justify-between px-4 py-5", collapsed && "justify-center px-2")}>
        <div onClick={onCloseMobile} className="cursor-pointer">
          <Logo />
        </div>
        <button
          onClick={onToggleCollapsed}
          className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-ink lg:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
        <button
          onClick={onCloseMobile}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-ink lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="slim-scroll flex-1 overflow-y-auto px-3 pb-6">
        {groupItems(items).map(([section, groupItems]) => (
          <div key={section ?? ""} className="mb-1">
            {section && !collapsed && (
              <p className="px-3 pb-1.5 pt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {section}
              </p>
            )}
            {section && collapsed && <div className="mx-3 my-3 border-t border-slate-200" />}
            {groupItems.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-full px-3 py-2 text-[13px] font-medium transition-all duration-200",
                    collapsed ? "justify-center px-0" : "",
                    active
                      ? "bg-brand-700 text-white shadow-pop"
                      : "text-slate-500 hover:bg-slate-100/80 hover:text-ink"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon name={item.icon} className={cn("h-4 w-4 flex-shrink-0", active ? "text-accent-400" : "text-slate-400 group-hover:text-brand-700")} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && <span className={cn("ml-auto h-1.5 w-1.5 flex-shrink-0 rounded-full", active ? "bg-accent-400" : "bg-accent-500/70")} />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-3">
        {/* Sidebar footer promo (DESIGN.md §5.1) — static brand card with
            contour-line texture, doctor shell only */}
        {!collapsed && promo && (
          <div className="relative mb-3 overflow-hidden rounded-3xl bg-navy-950 p-4 text-white">
            <ContourLines />
            <div className="relative">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">Mobile App</p>
              <p className="mt-1 text-[13px] font-semibold">Download Doctor App</p>
              <p className="mt-1 text-[11px] text-white/60">Manage appointments on the move</p>
              <a
                href="https://wa.me/919217375831"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-brand-700 py-2 text-[12px] font-semibold text-white transition hover:bg-brand-600"
              >
                <Download className="h-3.5 w-3.5" />
                Download App
              </a>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-white/70">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" />
                +91 921 7375 831 · 24×7
              </p>
            </div>
          </div>
        )}
        <Link
          href={footerHref}
          target={footerHref.startsWith("http") ? "_blank" : undefined}
          onClick={onCloseMobile}
          className={cn(
            "flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100/80 hover:text-ink",
            collapsed && "justify-center px-0"
          )}
          title={collapsed ? footerLabel : undefined}
        >
          <GlobeIcon className="h-5 w-5 text-slate-400" />
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
          "fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200 bg-white transition-all duration-300 lg:block",
          collapsed ? "w-[76px]" : "w-64"
        )}
      >
        {nav}
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onCloseMobile}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 bg-white transition-transform duration-300 lg:hidden",
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
