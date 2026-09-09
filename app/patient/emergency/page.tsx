import type { Metadata } from "next";
import { Phone, PhoneCall } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getCompanySettings } from "@/lib/queries/landing";
import { PageHeader, StatusBadge } from "@/components/ui/dashboard-ui";
import { getMyActiveRequest, getMySosHistory } from "@/lib/dispatch/actions";
import { SosDispatchButton } from "./sos-dispatch";

export const metadata: Metadata = { title: "Emergency · Patient" };
export const dynamic = "force-dynamic";

export default async function EmergencyPage() {
  await requireRole(["patient"]);
  const settings = await getCompanySettings();
  const supportPhone = settings?.companyMobile1 ?? "+91 108";
  // Resume an in-flight SOS if the patient reloads mid-dispatch.
  const [active, history] = await Promise.all([getMyActiveRequest(), getMySosHistory()]);

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Emergency help"
        subtitle="If this is a medical emergency, call emergency services now"
      />

      <div className="space-y-4">
        {/* Uber-style SOS dispatch (big red button + live map tracking) */}
        <SosDispatchButton initialRequestId={active?.id ?? null} />

        {/* Call cards */}
        <div className="overflow-hidden rounded-3xl border-2 border-red-200 bg-white shadow-lg">
          <div className="space-y-3 p-5">
            <a
              href="tel:108"
              className="flex items-center justify-center gap-3 rounded-2xl bg-red-600 px-6 py-4 text-base font-bold text-white transition hover:bg-red-700"
            >
              <Phone className="h-5 w-5" /> Call Emergency (108)
            </a>
            <a
              href="tel:102"
              className="flex items-center justify-center gap-3 rounded-2xl border-2 border-red-300 px-6 py-3.5 font-semibold text-red-700 transition hover:bg-red-50"
            >
              <PhoneCall className="h-5 w-5" /> Ambulance (102)
            </a>
            <a
              href={`tel:${supportPhone.replace(/[^0-9+]/g, "")}`}
              className="flex items-center justify-center gap-3 rounded-2xl border-2 border-slate-200 px-6 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <PhoneCall className="h-5 w-5" /> Clinic: {supportPhone}
            </a>
          </div>
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-center text-xs text-amber-800">
            Emergency numbers vary by country. In India: 108 (medical), 102 (ambulance), 112 (general).
          </p>
        </div>

        {/* Past emergencies */}
        {history.length > 0 && (
          <div className="overflow-hidden rounded-3xl border-2 border-slate-200 bg-white shadow-lg">
            <div className="p-5 pb-0">
              <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">Past emergencies</h2>
            </div>
            <ul className="divide-y divide-slate-100 p-5 pt-3">
              {history.map((h) => (
                <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {h.acceptedBy ? `Attended by Dr. ${h.acceptedBy}` : "No doctor accepted"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {h.createdAt
                        ? new Date(h.createdAt).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "—"}
                    </p>
                  </div>
                  <StatusBadge status={h.status} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
