import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { resolvePracticeDoctorId } from "@/lib/queries/doctor";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { SettingsTabs } from "./settings-tabs";
import PlanCard from "@/components/packages/plan-card";

export const metadata: Metadata = { title: "Settings · Doctor" };

export default async function SettingsPage() {
  const user = await requireRole(["doctor", "receptionist"]);
  const practiceDoctorId = resolvePracticeDoctorId(user);

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />
      {/* Server-rendered so the plan state never lands in a client bundle. */}
      <SettingsTabs
        user={user}
        planSlot={
          <PlanCard
            viewerId={user.id}
            viewerRole={user.role}
            viewerName={user.name}
            viewerEmail={user.email}
            viewerPhone={user.phone}
            practiceDoctorId={practiceDoctorId}
          />
        }
      />
    </div>
  );
}