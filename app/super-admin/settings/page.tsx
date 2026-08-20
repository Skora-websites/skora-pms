import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { companySettings } from "@/lib/db/schema";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { CompanySettingsForm } from "./company-settings-form";

export const metadata: Metadata = { title: "Settings · Super Admin" };

export default async function SettingsPage() {
  await requireRole(["super_admin", "admin"]);
  const [company] = await db.select().from(companySettings).limit(1);

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Company identity, branding and platform defaults"
      />
      <CompanySettingsForm company={company ?? null} />
    </div>
  );
}