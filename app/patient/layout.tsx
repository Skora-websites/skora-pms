import { requireRole } from "@/lib/auth/guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type { NavItem } from "@/components/dashboard/sidebar";

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/patient", icon: "layout-dashboard", exact: true },
  { label: "Find a Doctor", href: "/patient/find-doctor", icon: "stethoscope" },
  { label: "Appointments", href: "/patient/appointments", icon: "calendar-days" },
  { label: "Prescriptions", href: "/patient/prescriptions", icon: "file-text" },
  { label: "Test Reports", href: "/patient/test-reports", icon: "test-tube" },
  { label: "My Bills", href: "/patient/bills", icon: "receipt" },
  { label: "My Health Records", href: "/patient/records", icon: "file-heart" },
  { label: "Emergency", href: "/patient/emergency", icon: "siren" },
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
