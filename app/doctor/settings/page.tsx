import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { SettingsTabs } from "./settings-tabs";

export const metadata: Metadata = { title: "Settings · Doctor" };

export default async function SettingsPage() {
  const user = await requireRole(["doctor", "receptionist", "admin"]);

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />
      <SettingsTabs user={user} />
    </div>
  );
}