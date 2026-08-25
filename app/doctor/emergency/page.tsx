import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { getMySosOffers, getMyActiveCase } from "@/lib/dispatch/actions";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { EmergencyPanel } from "./emergency-panel";

export const metadata: Metadata = { title: "Emergency · Doctor" };
export const dynamic = "force-dynamic";

export default async function DoctorEmergencyPage() {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  const [offers, activeCase] = await Promise.all([getMySosOffers(), getMyActiveCase()]);

  return (
    <div>
      <PageHeader
        title="Emergency Dispatch"
        subtitle="Accept nearby emergency requests in real time"
      />
      <EmergencyPanel
        initialOffers={offers}
        initialOnDuty={Boolean(user.onDuty)}
        initialActiveCase={activeCase}
      />
    </div>
  );
}
