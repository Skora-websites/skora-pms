import { requireRole } from "@/lib/auth/guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { NavItem } from "@/components/dashboard/sidebar";

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/super-admin", icon: "layout-dashboard", exact: true },
  { label: "Manage Doctors", href: "/super-admin/doctors", icon: "user-cog" },
  { label: "Manage Clinics", href: "/super-admin/clinics", icon: "building-2" },
  { label: "Manage Users", href: "/super-admin/users", icon: "users" },
  { label: "Consult Masters", href: "/super-admin/masters", icon: "clipboard-list" },
  { label: "Blogs", href: "/super-admin/blogs", icon: "newspaper" },
  { label: "Support", href: "/super-admin/support", icon: "headset" },
  { label: "Landing Page", href: "/super-admin/landing", icon: "panels-top-left" },
  { label: "Email Setup", href: "/super-admin/email-setup", icon: "mail" },
  { label: "Settings", href: "/super-admin/settings", icon: "settings" },
];

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["super_admin", "admin"]);

  return (
    <DashboardShell
      navItems={NAV}
      user={{
        name: user.name,
        role: user.role,
        email: user.email,
        profilePhotoPath: user.profilePhotoPath,
      }}
      footerHref="/"
      footerLabel="View public site"
    >
      {children}
    </DashboardShell>
  );
}
