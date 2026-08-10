import { requireRole } from "@/lib/auth/guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { NavItem } from "@/components/dashboard/sidebar";

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/patient", icon: "layout-dashboard", exact: true },
  { label: "Appointments", href: "/patient/appointments", icon: "calendar-days" },
  { label: "My Health Records", href: "/patient/records", icon: "file-heart" },
];

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["patient"]);

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
      footerLabel="Back to website"
    >
      {children}
    </DashboardShell>
  );
}
