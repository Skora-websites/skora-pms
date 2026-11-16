import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { getCompanySettings } from "@/lib/queries/landing";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { getMyActiveRequest, getMySosHistory } from "@/lib/dispatch/actions";
import { SosDispatchButton } from "./sos-dispatch";

export const metadata: Metadata = { title: "Emergency SOS · Patient" };
export const dynamic = "force-dynamic";

export default async function EmergencyPage() {
  const user = await requireRole(["patient"]);
  const settings = await getCompanySettings();
  const supportPhone = settings?.companyMobile1 ?? "+91 108";
  // Resume an in-flight SOS if the patient reloads mid-dispatch.
  const [active, history] = await Promise.all([getMyActiveRequest(), getMySosHistory()]);

  return (
    <div className="mx-auto max-w-xl pb-10">
      <PageHeader
        title="Emergency Help"
        subtitle="On-demand emergency response units and immediate medical dispatch"
      />

      <div className="mt-4">
        <SosDispatchButton
          initialRequestId={active?.id ?? null}
          history={history}
          supportPhone={supportPhone}
          patientName={user.name}
          patientPhone={user.phone ?? ""}
        />
      </div>
    </div>
  );
}
