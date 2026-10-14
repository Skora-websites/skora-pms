import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { requireAdminTier } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import {
  countDoctorsPerClinic,
  countSchedulesPerClinic,
  listManagersPerClinic,
  listScopedClinics,
  scopeOrSentinel,
} from "@/lib/queries/admin";
import { PageHeader, EmptyState } from "@/components/ui/dashboard-ui";
import { formatINR } from "@/lib/utils";
import { AddClinicButton, ClinicCardActions, type ClinicCard } from "./clinics-client";
import { clinicDoctorOptions } from "./actions";

export const metadata: Metadata = { title: "Clinics · Business" };

export default async function AdminClinicsPage() {
  await requireAdminTier("/admin/clinics");
  const scope = await getBusinessScope();
  const clinicIds = scopeOrSentinel(scope.clinicIds);

  const [clinics, doctorCountByClinic, scheduleCountByClinic, managersByClinic, doctors] =
    await Promise.all([
      listScopedClinics(clinicIds),
      countDoctorsPerClinic(clinicIds),
      countSchedulesPerClinic(clinicIds),
      listManagersPerClinic(clinicIds),
      clinicDoctorOptions(),
    ]);

  const cards: ClinicCard[] = clinics.map((c) => ({
    id: c.id,
    clinicName: c.clinicName,
    addressType: c.addressType,
    address: c.address,
    latitude: c.latitude,
    longitude: c.longitude,
    phone: c.phone,
    consultationFee: c.consultationFee,
    isActive: c.isActive ?? true,
  }));

  return (
    <div>
      <PageHeader
        title="Clinics"
        subtitle={`${clinics.length} clinic${clinics.length === 1 ? "" : "s"} across your business`}
        action={<AddClinicButton doctors={doctors} />}
      />

      {clinics.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No clinics yet"
          description="Add your first clinic to start scheduling doctors and taking appointments."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map((c) => (
            <div key={c.id} className={`card p-6 ${c.isActive ? "" : "opacity-60"}`}>
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                  <Building2 className="h-5 w-5" />
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      c.isActive ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                  <ClinicCardActions clinic={c} />
                </div>
              </div>
              <h3 className="mt-4 text-[17px] font-semibold tracking-[-0.01em] text-ink">
                {c.clinicName}
              </h3>
              <p className="mt-1 text-sm text-slate-500">{c.address}</p>
              <p className="text-xs text-slate-400">{c.phone}</p>

              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-slate-50 px-2 py-2">
                  <dt className="text-[11px] font-semibold uppercase text-slate-400">Doctors</dt>
                  <dd className="text-sm font-bold text-ink">
                    {doctorCountByClinic.get(c.id) ?? 0}
                  </dd>
                </div>
                <div className="rounded-xl bg-slate-50 px-2 py-2">
                  <dt className="text-[11px] font-semibold uppercase text-slate-400">Slots</dt>
                  <dd className="text-sm font-bold text-ink">
                    {scheduleCountByClinic.get(c.id) ?? 0}
                  </dd>
                </div>
                <div className="rounded-xl bg-slate-50 px-2 py-2">
                  <dt className="text-[11px] font-semibold uppercase text-slate-400">Fee</dt>
                  <dd className="text-sm font-bold text-ink">
                    {c.consultationFee ? formatINR(Number(c.consultationFee)) : "—"}
                  </dd>
                </div>
              </dl>

              <p className="mt-4 text-xs text-slate-500">
                <span className="font-semibold text-slate-400">Managers:</span>{" "}
                {managersByClinic.get(c.id)?.length
                  ? managersByClinic.get(c.id)?.join(", ")
                  : "None assigned"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
