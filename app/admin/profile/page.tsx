import type { Metadata } from "next";
import { requireAdminTier } from "@/lib/auth/guard";
import { getCurrentUser } from "@/lib/auth/user";
import { getBusinessScope } from "@/lib/auth/scope";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "My Profile · Business" };

/**
 * Admin-tier profile.
 *
 * The shared header pointed `/admin` users at `/doctor/profile`, which the
 * doctor layout rejects for the admin/manager tier (audit H9) — the dropdown
 * was a dead link with no owner profile anywhere.
 */
export default async function AdminProfilePage() {
  await requireAdminTier("/admin/profile");

  const user = await getCurrentUser();
  const scope = await getBusinessScope();

  return (
    <>
      <PageHeader
        title="My Profile"
        subtitle="Your account details and the businesses you operate."
      />
      <ProfileForm
        user={{
          name: user?.name ?? "",
          email: user?.email ?? "",
          phone: user?.phone ?? "",
          profilePhotoPath: user?.profilePhotoPath ?? null,
          roleLabel: scope.viewerRole === "owner" ? "Business Owner" : "Clinic Manager",
          businessCount: scope.businessIds.length,
          clinicCount: scope.clinicIds.length,
        }}
      />
    </>
  );
}
