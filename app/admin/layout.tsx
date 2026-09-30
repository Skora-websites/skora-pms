import { headers } from "next/headers";
import { requireAdminTier } from "@/lib/auth/guard";
import { getUserPermissions } from "@/lib/auth/user";
import { getBusinessScope } from "@/lib/auth/scope";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { NavItem } from "@/components/dashboard/sidebar";
import { AdminEmptyState } from "./empty";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // requireAdminTier validates the session + role and enforces the per-route
  // module map server-side (redirect before page data is fetched) — same
  // x-pathname pattern as the doctor layout. x-pathname now carries
  // "path?query"; the permission matcher wants the bare pathname.
  const [rawPathname] = ((await headers()).get("x-pathname") ?? "/admin").split("?");
  const { user, viewerRole } = await requireAdminTier(rawPathname);

  const scope = await getBusinessScope();

  // No business → nothing to operate on yet. Managers with zero assignments
  // and owners with zero businesses both land here instead of empty pages.
  if (scope.businessIds.length === 0) {
    return <AdminEmptyState isOwner={viewerRole === "owner"} />;
  }

  // Owners bypass module filtering (requireAdminTier already let them
  // through); managers only see modules they hold a permission for.
  const isOwner = viewerRole === "owner";
  const perms = isOwner ? new Set<string>() : await getUserPermissions(user.id);

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
