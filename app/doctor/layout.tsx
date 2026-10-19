import { requireRole } from "@/lib/auth/guard";
import { getUserPermissions } from "@/lib/auth/user";
import {
  doctorPathToReceptionist,
  receptionistPathToDoctor,
  resolveDoctorPanelRedirect,
} from "@/lib/auth/permissions";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DoctorPermissionGate } from "@/components/doctor/permission-gate";
import type { NavItem } from "@/components/dashboard/sidebar";
import { dutyModeOf } from "@/lib/utils";
import { getUnreadCount } from "@/app/doctor/notifications/actions";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["doctor", "receptionist"]);
  // Trial-expired guard (legacy trialExpired parity): doctors with an ended
  // trial are locked out of the dashboard until they renew.
  if (user.role === "doctor" && user.trialEndsAt && user.trialEndsAt <= new Date()) {
    redirect("/trial-expired");
  }
  const perms = await getUserPermissions(user.id);

  // URL-space split: receptionists browse under /receptionist/* (the proxy
  // rewrites it onto these /doctor routes); doctors keep /doctor only. Bounce
  // each role out of the other's prefix before any page data is fetched.
  // x-pathname now carries "path?query"; split it so the module-permission
  // match keeps seeing the bare pathname while redirects preserve queries.
  const [rawPathname, rawSearch = ""] = (
    (await headers()).get("x-pathname") ?? "/doctor"
  ).split("?");
  const keepSearch = (p: string) => (rawSearch ? `${p}?${rawSearch}` : p);
  const pathname = receptionistPathToDoctor(rawPathname);
  if (user.role === "receptionist" && !rawPathname.startsWith("/receptionist")) {
    redirect(keepSearch(doctorPathToReceptionist(rawPathname)));
  }
  if (user.role !== "receptionist" && rawPathname.startsWith("/receptionist")) {
    redirect(keepSearch(receptionistPathToDoctor(rawPathname)));
  }

  // Server-side page guard: redirect before the page component runs, so a
  // restricted URL never executes its data queries or renders. The boundary
  // rule is shared with the client <DoctorPermissionGate> via
  // resolveDoctorPanelRedirect, so the two cannot drift (audit M7).
  const isReceptionistPanel = user.role === "receptionist";
  const redirected = resolveDoctorPanelRedirect(pathname, isReceptionistPanel, perms);
  if (redirected !== null) {
    // Receptionists speak /receptionist/*; keep everyone on their own prefix.
    const friendly = isReceptionistPanel ? doctorPathToReceptionist(redirected) : redirected;
    // Avoid a redirect loop when the fallback is the page itself (e.g. a
    // user with no permissions landing on /doctor).
    redirect(redirected === pathname ? (isReceptionistPanel ? "/receptionist" : "/") : friendly);
  }

  // Shared route→permission map (lib/auth/permissions.ts) — the same map the
  // server actions and the page gate enforce. Keeps nav + guards in sync.
  // `section` only affects sidebar grouping (DESIGN.md §5.1); access control
  // is unchanged.
  const NAV_BY_PERM: { perm: string; label: string; href: string; icon: NavItem["icon"]; exact?: boolean; section?: string; doctorOnly?: boolean }[] = [
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
    // "consultations" isn't in the permission catalog (nothing grants it),
    // so gating on it hid this entry for everyone. Route access already maps
    // /doctor/consultations to the "dashboard" module — match the nav to it.
    { perm: "dashboard", label: "Consultations", href: "/doctor/consultations", icon: "stethoscope", section: "Clinical modules", doctorOnly: true },
    { perm: "dashboard", label: "Online Consultations", href: "/doctor/online-consultations", icon: "video", section: "Clinical modules", doctorOnly: true },
    { perm: "dashboard", label: "Emergency", href: "/doctor/emergency", icon: "siren", section: "Clinical modules", doctorOnly: true },
    { perm: "support", label: "Support", href: "/doctor/support", icon: "headset", section: "General" },
    // doctorOnly mirrors the bounce above: these pages belong to the doctor,
    // never to the front desk (all map to the "dashboard" module).
    { perm: "dashboard", label: "Consult (PDF)", href: "/doctor/consult-pdf", icon: "file-text", section: "General", doctorOnly: true },
    { perm: "dashboard", label: "Reference", href: "/doctor/reference", icon: "newspaper", section: "General", doctorOnly: true },
    { perm: "dashboard", label: "Help / FAQ", href: "/doctor/faq", icon: "help-circle", section: "General", doctorOnly: true },
    { perm: "roles-permissions", label: "My Staff", href: "/doctor/staff", icon: "users", section: "Administration" },
    { perm: "roles-permissions", label: "Roles & Permission", href: "/doctor/roles", icon: "user-cog", section: "Administration" },
  ];

  // Receptionists see /receptionist/* URLs (rewritten onto these routes);
  // doctors see /doctor/*.
  // Emergency dispatch is a doctor-facing module — hidden from receptionist
  // panels (the on-duty SOS flow belongs to the doctor, not front desk).
  const navItems: NavItem[] = NAV_BY_PERM.filter(
    (n) => perms.has(n.perm) && !(isReceptionistPanel && n.doctorOnly)
  ).map((n) => ({
    label: n.label,
    href: isReceptionistPanel ? doctorPathToReceptionist(n.href) : n.href,
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
      dutyMode={dutyModeOf(user.onDuty)}
    >
      <DoctorPermissionGate perms={[...perms]} isReceptionist={isReceptionistPanel} />
      {children}
    </DashboardShell>
  );
}
