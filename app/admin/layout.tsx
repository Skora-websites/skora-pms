import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdminTier } from "@/lib/auth/guard";
import { getUserPermissions } from "@/lib/auth/user";
import { getBusinessScope } from "@/lib/auth/scope";
import { firstPermittedAdminPath, hasAdminModuleAccess } from "@/lib/auth/permissions";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { NavItem } from "@/components/dashboard/sidebar";
import { AdminEmptyState } from "./empty";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // requireAdminTier validates the session + role — same x-pathname pattern
  // as the doctor layout. x-pathname now carries "path?query"; the permission
  // matcher wants the bare pathname.
  //
  // The pathname is deliberately NOT handed to requireAdminTier: its
  // fallback for a module-less manager is firstPermittedAdminPath → "/admin",
  // which itself needs the `dashboard` perm, so the guard's own loop-escape
  // fired and dumped the manager on the public marketing home page. The
  // module map is enforced in this layout instead (below), so this shell
  // decides where a manager without any module lands.
  const [rawPathname] = ((await headers()).get("x-pathname") ?? "/admin").split("?");
  const { user, viewerRole } = await requireAdminTier();

  // Owners bypass module filtering; managers only see modules they hold a
  // permission for. The /admin/no-access path itself carries no module, so a
  // manager must be allowed through it or the landing would loop.
  const isOwner = viewerRole === "owner";
  const perms = isOwner ? new Set<string>() : await getUserPermissions(user.id);
  const NO_ACCESS_PATH = "/admin/no-access";

  const scope = await getBusinessScope();

  // Shared route→permission enforcement (lib/auth/permissions.ts), replacing
  // the guard's own check so this layout owns the redirect target.
  if (!isOwner && rawPathname !== NO_ACCESS_PATH) {
    if (perms.size === 0) {
      // No module at all → an admin-scoped explanation beats the public site.
      // A manager with no clinic assignment has no business to show yet, so
      // the empty state below (not this page) is the right answer for them.
      if (scope.businessIds.length > 0) redirect(NO_ACCESS_PATH);
    } else if (!hasAdminModuleAccess(perms, rawPathname, viewerRole)) {
      redirect(firstPermittedAdminPath(perms, viewerRole));
    }
  }

  // No business → nothing to operate on yet. Managers with zero assignments
  // and owners with zero businesses both land here instead of empty pages.
  if (scope.businessIds.length === 0) {
    return <AdminEmptyState isOwner={viewerRole === "owner"} />;
  }

  // Shared route→permission map (lib/auth/permissions.ts). `ownerOnly`
  // entries never render for managers.
  const NAV_BY_PERM: {
    perm: string;
    label: string;
    href: string;
    icon: NavItem["icon"];
    exact?: boolean;
    section?: string;
    ownerOnly?: boolean;
  }[] = [
    { perm: "dashboard", label: "Overview", href: "/admin", icon: "layout-dashboard", exact: true },
    { perm: "clinics", label: "Clinics", href: "/admin/clinics", icon: "building-2", section: "Business", ownerOnly: true },
    { perm: "managers", label: "Managers", href: "/admin/managers", icon: "user-cog", section: "Business", ownerOnly: true },
    { perm: "business-settings", label: "Business Settings", href: "/admin/settings", icon: "settings", section: "Business", ownerOnly: true },
    { perm: "schedule", label: "Schedule", href: "/admin/schedule", icon: "calendar-clock", section: "Clinic operations" },
    { perm: "registrations", label: "Registrations", href: "/admin/patients", icon: "user-plus", section: "Clinic operations" },
    { perm: "appointments", label: "Appointments", href: "/admin/appointments", icon: "calendar-days", section: "Clinic operations" },
    { perm: "follow-up", label: "Follow Ups", href: "/admin/follow-ups", icon: "phone-call", section: "Clinic operations" },
    { perm: "test-booking", label: "Test Bookings", href: "/admin/test-bookings", icon: "test-tube", section: "Clinic operations" },
    { perm: "billing", label: "Billing", href: "/admin/billing", icon: "calculator", section: "Finance" },
    { perm: "income-expense", label: "Income & Expense", href: "/admin/income-expense", icon: "wallet", section: "Finance" },
    { perm: "home-visit", label: "Home Visits", href: "/admin/home-visits", icon: "home", section: "Clinic operations" },
    { perm: "consultations", label: "Consultations", href: "/admin/consultations", icon: "stethoscope", section: "Clinic operations" },
    { perm: "online-consultations", label: "Online Consultations", href: "/admin/online-consultations", icon: "video", section: "Clinic operations" },
    { perm: "shop", label: "Shop", href: "/admin/shop", icon: "shopping-cart", section: "Clinic operations" },
    { perm: "chat", label: "Chat", href: "/admin/chat", icon: "messages-square", section: "General" },
    { perm: "support", label: "Support", href: "/admin/support", icon: "headset", section: "General" },
    { perm: "roles-permissions", label: "Clinic Staff", href: "/admin/staff", icon: "users", section: "Administration" },
  ];

  const navItems: NavItem[] = NAV_BY_PERM.filter((n) => {
    if (isOwner) return true;
    return !n.ownerOnly && perms.has(n.perm);
  }).map((n) => ({
    label: n.label,
    href: n.href,
    icon: n.icon,
    ...(n.exact ? { exact: true } : {}),
    ...(n.section ? { section: n.section } : {}),
  }));

  return (
    <DashboardShell
      navItems={navItems}
      user={{
        name: user.name,
        role: isOwner ? "Business Owner" : "Clinic Manager",
        email: user.email,
        profilePhotoPath: user.profilePhotoPath,
      }}
      footerHref="/"
      footerLabel="View public site"
      searchHref="/admin/patients"
    >
      {children}
    </DashboardShell>
  );
}
