import type { Metadata } from "next";
import { Siren, Phone, PhoneCall } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getCompanySettings } from "@/lib/queries/landing";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { SosForm } from "./sos-form";

export const metadata: Metadata = { title: "Emergency · Patient" };
export const dynamic = "force-dynamic";

export default async function EmergencyPage() {
  await requireRole(["patient"]);
  const settings = await getCompanySettings();
  const supportPhone = settings?.companyMobile1 ?? "+91 108";

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Emergency help"
        subtitle="If this is a medical emergency, call emergency services now"
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.15fr]">
        {/* Call cards */}
        <div className="space-y-3">
          <div className="overflow-hidden rounded-3xl border-2 border-red-200 bg-white shadow-lg">
            <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-7 text-center text-white">
              <Siren className="mx-auto h-10 w-10 animate-pulse" />
              <h2 className="mt-3 font-display text-xl font-extrabold">EMERGENCY</h2>
              <p className="mt-1 text-xs text-white/80">Call for immediate medical assistance</p>
            </div>
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
          </div>
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-center text-xs text-amber-800">
            Emergency numbers vary by country. In India: 108 (medical), 102 (ambulance), 112 (general).
          </p>
        </div>

        {/* SOS dispatch */}
        <SosForm />
      </div>
    </div>
  );
}
