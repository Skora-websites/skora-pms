import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { getCompanySettings } from "@/lib/queries/admin";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { CompanySettingsForm } from "./company-settings-form";

export const metadata: Metadata = { title: "Settings · Super Admin" };

export default async function SettingsPage() {
  await requireRole(["super_admin"]);
  const company = await getCompanySettings();

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Company identity, branding and platform defaults"
      />
      <CompanySettingsForm company={company} />
    </div>
  );
}
