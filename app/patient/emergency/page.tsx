import type { Metadata } from "next";
import { Phone, PhoneCall } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getCompanySettings } from "@/lib/queries/landing";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { SosDispatchButton } from "./sos-dispatch";

export const metadata: Metadata = { title: "Emergency · Patient" };
export const dynamic = "force-dynamic";

export default async function EmergencyPage() {
  await requireRole(["patient"]);
  const settings = await getCompanySettings();
  const supportPhone = settings?.companyMobile1 ?? "+91 108";

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Emergency help"
        subtitle="If this is a medical emergency, call emergency services now"
      />

      <div className="space-y-4">
        {/* Uber-style SOS dispatch (big red button + live map tracking) */}
        <SosDispatchButton />

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
      </div>
    </div>
  );
}
