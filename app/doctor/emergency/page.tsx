import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { getMySosOffers, getMyActiveCase, getMySosCaseHistory } from "@/lib/dispatch/actions";
import { PageHeader, StatusBadge } from "@/components/ui/dashboard-ui";
import { EmergencyPanel } from "./emergency-panel";

export const metadata: Metadata = { title: "Emergency · Doctor" };
export const dynamic = "force-dynamic";

export default async function DoctorEmergencyPage() {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  const [offers, activeCase, history] = await Promise.all([
    getMySosOffers(),
    getMyActiveCase(),
    getMySosCaseHistory(),
  ]);

  return (
    <div>
      <PageHeader
        title="Emergency Dispatch"
        subtitle="Accept nearby emergency requests in real time"
      />
      <EmergencyPanel
        initialOffers={offers}
        initialOnDuty={Boolean(user.onDuty)}
        initialActiveCase={activeCase?.sosRequestId ?? null}
        initialCasePatient={
          activeCase
            ? { lat: activeCase.patientLatitude, lng: activeCase.patientLongitude }
            : null
        }
      />

      {/* Past emergency cases */}
      {history.length > 0 && (
        <div className="card mt-4 p-6">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">Past cases</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{h.patientName}</p>
                  <p className="text-xs text-slate-500">
                    {h.acceptedAt
                      ? new Date(h.acceptedAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "—"}
                    {h.complaint ? ` · ${h.complaint}` : ""}
                  </p>
                </div>
                <StatusBadge status={h.status} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
