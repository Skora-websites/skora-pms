import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinicDoctors, clinicManagers, doctorClinics, doctorSchedules, users } from "@/lib/db/schema";
import { requireAdminTier } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { PageHeader, EmptyState } from "@/components/ui/dashboard-ui";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Clinics · Business" };

export default async function AdminClinicsPage() {
  await requireAdminTier("/admin/clinics");
  const scope = await getBusinessScope();
  const clinicIds = scope.clinicIds.length ? scope.clinicIds : [-1];

  const [clinics, doctorCounts, scheduleCounts, managers] = await Promise.all([
    db
      .select({
        id: doctorClinics.id,
        clinicName: doctorClinics.clinicName,
        address: doctorClinics.address,
        phone: doctorClinics.phone,
        consultationFee: doctorClinics.consultationFee,
        isActive: doctorClinics.isActive,
      })
      .from(doctorClinics)
      .where(inArray(doctorClinics.id, clinicIds))
      .orderBy(asc(doctorClinics.id)),
    db
      .select({
        clinicId: clinicDoctors.clinicId,
        count: sql<number>`count(distinct ${clinicDoctors.doctorId})`,
      })
      .from(clinicDoctors)
      .where(inArray(clinicDoctors.clinicId, clinicIds))
      .groupBy(clinicDoctors.clinicId),
    db
      .select({
        clinicId: doctorSchedules.doctorClinicId,
        count: sql<number>`count(*)`,
      })
      .from(doctorSchedules)
      .where(inArray(doctorSchedules.doctorClinicId, clinicIds))
      .groupBy(doctorSchedules.doctorClinicId),
    db
      .select({
        clinicId: clinicManagers.clinicId,
        userId: clinicManagers.userId,
        userName: users.name,
      })
      .from(clinicManagers)
      .innerJoin(users, eq(users.id, clinicManagers.userId))
      .where(inArray(clinicManagers.clinicId, clinicIds)),
  ]);

  const doctorCountByClinic = new Map(doctorCounts.map((r) => [r.clinicId, Number(r.count)]));
  const scheduleCountByClinic = new Map(scheduleCounts.map((r) => [r.clinicId, Number(r.count)]));
  const managersByClinic = new Map<number, string[]>();
  for (const m of managers) {
    const list = managersByClinic.get(m.clinicId) ?? [];
    list.push(m.userName);
    managersByClinic.set(m.clinicId, list);
  }

  return (
    <div>
      <PageHeader
        title="Clinics"
        subtitle={`${clinics.length} clinic${clinics.length === 1 ? "" : "s"} across your business`}
      />

      {clinics.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No clinics yet"
          description="Clinics linked to your business will appear here."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {clinics.map((c) => (
            <div key={c.id} className="card p-6">
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                  <Building2 className="h-5 w-5" />
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    c.isActive ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {c.isActive ? "Active" : "Inactive"}
                </span>
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
                  ? managersByClinic.get(c.id)!.join(", ")
                  : "None assigned"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
