import { requireRole } from "@/lib/auth/guard";
import { getUserPermissions } from "@/lib/auth/user";
import {
  firstPermittedDoctorPath,
  hasDoctorModuleAccess,
} from "@/lib/auth/permissions";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DoctorPermissionGate } from "@/components/doctor/permission-gate";
import type { NavItem } from "@/components/dashboard/sidebar";
import { getUnreadCount } from "@/app/doctor/notifications/actions";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  // Trial-expired guard (legacy trialExpired parity): doctors with an ended
  // trial are locked out of the dashboard until they renew.
  if (user.role === "doctor" && user.trialEndsAt && user.trialEndsAt <= new Date()) {
    redirect("/trial-expired");
  }
  const perms = await getUserPermissions(user.id);

  // Server-side page guard: redirect before the page component runs, so a
  // restricted URL never executes its data queries or renders. The client
  // <DoctorPermissionGate> mirrors this for client-side navigation.
  const pathname = (await headers()).get("x-pathname") ?? "/doctor";
  if (!hasDoctorModuleAccess(perms, pathname)) {
    const target = firstPermittedDoctorPath(perms);
    // Avoid a redirect loop when the fallback is the page itself (e.g. a
    // user with no permissions landing on /doctor).
    redirect(target === pathname ? "/" : target);
  }

  // Shared route→permission map (lib/auth/permissions.ts) — the same map the
  // server actions and the page gate enforce. Keeps nav + guards in sync.
  // `section` only affects sidebar grouping (DESIGN.md §5.1); access control
  // is unchanged.
  const NAV_BY_PERM: { perm: string; label: string; href: string; icon: NavItem["icon"]; exact?: boolean; section?: string }[] = [
    { perm: "dashboard", label: "Dashboard", href: "/doctor", icon: "layout-dashboard", exact: true },
    { perm: "schedule", label: "Schedule Time", href: "/doctor/schedule", icon: "calendar-clock", section: "Clinical modules" },
    { perm: "registrations", label: "Registrations", href: "/doctor/patients", icon: "user-plus", section: "Clinical modules" },
    { perm: "appointments", label: "Appointments", href: "/doctor/appointments", icon: "calendar-days", section: "Clinical modules" },
    { perm: "follow-up", label: "Follow Ups", href: "/doctor/follow-ups", icon: "phone-call", section: "Clinical modules" },
    { perm: "income-expense", label: "Income & Expense", href: "/doctor/income-expense", icon: "wallet", section: "Clinical modules" },
    { perm: "test-booking", label: "Test Booking", href: "/doctor/test-bookings", icon: "test-tube", section: "Clinical modules" },
    { perm: "billing", label: "Billing", href: "/doctor/billing", icon: "calculator", section: "Clinical modules" },
    { perm: "home-visit", label: "Home Visit", href: "/doctor/home-visits", icon: "home", section: "Clinical modules" },
    { perm: "chat", label: "Chat", href: "/doctor/chat", icon: "messages-square", section: "Clinical modules" },
    { perm: "shop", label: "Shop", href: "/doctor/shop", icon: "shopping-cart", section: "Clinical modules" },
    { perm: "consultations", label: "Consultations", href: "/doctor/consultations", icon: "stethoscope", section: "Clinical modules" },
    { perm: "dashboard", label: "Online Consultations", href: "/doctor/online-consultations", icon: "video", section: "Clinical modules" },
    { perm: "dashboard", label: "Consult PDF", href: "/doctor/consult-pdf", icon: "file-text", section: "Clinical modules" },
    { perm: "dashboard", label: "Emergency", href: "/doctor/emergency", icon: "siren", section: "Clinical modules" },
    { perm: "dashboard", label: "Notifications", href: "/doctor/notifications", icon: "bell", section: "General" },
    { perm: "dashboard", label: "FAQ", href: "/doctor/faq", icon: "help-circle", section: "General" },
    { perm: "support", label: "Support", href: "/doctor/support", icon: "headset", section: "General" },
    { perm: "roles-permissions", label: "My Staff", href: "/doctor/staff", icon: "users", section: "Administration" },
    { perm: "roles-permissions", label: "Roles & Permission", href: "/doctor/roles", icon: "user-cog", section: "Administration" },
  ];

  const navItems: NavItem[] = NAV_BY_PERM.filter((n) => perms.has(n.perm)).map((n) => ({
    label: n.label,
    href: n.href,
    icon: n.icon,
    ...(n.exact ? { exact: true } : {}),
    ...(n.section ? { section: n.section } : {}),
  }));
  const unreadCount = await getUnreadCount();

  return (
    <DashboardShell
      navItems={navItems}
      user={{
        name: user.name,
        role: user.role,
        email: user.email,
        profilePhotoPath: user.profilePhotoPath,
      }}
      unreadCount={unreadCount}
      footerHref="/"
      footerLabel="View public site"
      searchHref="/doctor/patients"
      promo
    >
      <DoctorPermissionGate perms={[...perms]} />
      {children}
    </DashboardShell>
  );
}
