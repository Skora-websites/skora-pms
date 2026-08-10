import { requireRole } from "@/lib/auth/guard";
import { getUserPermissions } from "@/lib/auth/user";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { NavItem } from "@/components/dashboard/sidebar";

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  const perms = await getUserPermissions(user.id);

  const ALL_NAV: { perm: string; item: NavItem }[] = [
    { perm: "dashboard", item: { label: "Dashboard", href: "/doctor", icon: "layout-dashboard", exact: true } },
    { perm: "schedule", item: { label: "Schedule Time", href: "/doctor/schedule", icon: "calendar-clock" } },
    { perm: "registrations", item: { label: "Registrations", href: "/doctor/patients", icon: "user-plus" } },
    { perm: "appointments", item: { label: "Appointments", href: "/doctor/appointments", icon: "calendar-days" } },
    { perm: "follow-up", item: { label: "Follow Ups", href: "/doctor/follow-ups", icon: "phone-call" } },
    { perm: "income-expense", item: { label: "Income & Expense", href: "/doctor/income-expense", icon: "wallet" } },
    { perm: "test-booking", item: { label: "Test Booking", href: "/doctor/test-bookings", icon: "test-tube" } },
    { perm: "billing", item: { label: "Billing", href: "/doctor/billing", icon: "calculator" } },
    { perm: "home-visit", item: { label: "Home Visit", href: "/doctor/home-visits", icon: "home" } },
    { perm: "chat", item: { label: "Chat", href: "/doctor/chat", icon: "messages-square" } },
    { perm: "shop", item: { label: "Shop", href: "/doctor/shop", icon: "shopping-cart" } },
    { perm: "support", item: { label: "Support", href: "/doctor/support", icon: "headset" } },
    { perm: "dashboard", item: { label: "Consult PDF", href: "/doctor/consult-pdf", icon: "file-text" } },
    { perm: "roles-permissions", item: { label: "My Staff", href: "/doctor/staff", icon: "users" } },
    { perm: "roles-permissions", item: { label: "Roles & Permission", href: "/doctor/roles", icon: "user-cog" } },
  ];

  const navItems = ALL_NAV.filter((n) => perms.has(n.perm)).map((n) => n.item);

  return (
    <DashboardShell
      navItems={navItems}
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
