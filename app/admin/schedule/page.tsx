import type { Metadata } from "next";
import { CalendarClock } from "lucide-react";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinicDoctors, doctorClinics, doctorSchedules, users } from "@/lib/db/schema";
import { requireAdminTier } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { PageHeader, EmptyState } from "@/components/ui/dashboard-ui";

export const metadata: Metadata = { title: "Schedule · Business" };

export default async function AdminSchedulePage() {
  await requireAdminTier("/admin/schedule");
  const scope = await getBusinessScope();
  const clinicIds = scope.clinicIds.length ? scope.clinicIds : [-1];

  const [clinics, schedules, doctors] = await Promise.all([
    db
      .select({
        id: doctorClinics.id,
        clinicName: doctorClinics.clinicName,
        address: doctorClinics.address,
        phone: doctorClinics.phone,
      })
      .from(doctorClinics)
      .where(inArray(doctorClinics.id, clinicIds))
      .orderBy(asc(doctorClinics.id)),
    db
      .select({
        clinicId: doctorSchedules.doctorClinicId,
        doctorName: users.name,
        dayOfWeek: doctorSchedules.dayOfWeek,
        startTime: doctorSchedules.startTime,
        endTime: doctorSchedules.endTime,
        sessionType: doctorSchedules.sessionType,
        isActive: doctorSchedules.isActive,
      })
      .from(doctorSchedules)
      .innerJoin(users, eq(users.id, doctorSchedules.doctorId))
      .where(inArray(doctorSchedules.doctorClinicId, clinicIds))
      .orderBy(asc(doctorSchedules.doctorClinicId), asc(doctorSchedules.id)),
    db
      .select({ doctorId: clinicDoctors.doctorId, clinicId: clinicDoctors.clinicId, name: users.name })
      .from(clinicDoctors)
      .innerJoin(users, eq(users.id, clinicDoctors.doctorId))
      .where(inArray(clinicDoctors.clinicId, clinicIds)),
  ]);

  const schedulesByClinic = new Map<number, typeof schedules>();
  for (const s of schedules) {
    const list = schedulesByClinic.get(s.clinicId) ?? [];
    list.push(s);
    schedulesByClinic.set(s.clinicId, list);
  }
  const doctorsByClinic = new Map<number, string[]>();
  for (const d of doctors) {
    const list = doctorsByClinic.get(d.clinicId) ?? [];
    list.push(d.name);
    doctorsByClinic.set(d.clinicId, list);
  }

  return (
    <div>
      <PageHeader
        title="Schedule"
        subtitle="Weekly consultation slots at every clinic in your business"
      />

      {clinics.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No clinics in your business yet"
          description="Once clinics are linked to your business, their schedules appear here."
        />
      ) : (
        <div className="space-y-6">
          {clinics.map((clinic) => {
            const rows = schedulesByClinic.get(clinic.id) ?? [];
            const clinicDoctorsList = doctorsByClinic.get(clinic.id) ?? [];
            return (
              <div key={clinic.id} className="card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-6 py-4">
                  <div>
                    <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">
                      {clinic.clinicName}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {clinic.address} · {clinic.phone}
                    </p>
                  </div>
                  <p className="text-xs font-semibold text-slate-500">
                    {clinicDoctorsList.length} doctor{clinicDoctorsList.length === 1 ? "" : "s"}
                    {clinicDoctorsList.length > 0 ? `: ${clinicDoctorsList.join(", ")}` : ""}
                  </p>
                </div>
                {rows.length === 0 ? (
                  <p className="px-6 py-6 text-sm text-slate-400">No schedule slots yet.</p>
                ) : (
                  <div className="grid gap-2 px-6 py-4 sm:grid-cols-2 lg:grid-cols-3">
                    {rows.map((s, i) => (
                      <div
                        key={`${s.clinicId}-${i}`}
                        className={`rounded-xl border px-4 py-3 text-sm ${
                          s.isActive ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 opacity-60"
                        }`}
                      >
                        <p className="font-semibold capitalize text-ink">
                          {s.dayOfWeek} · {String(s.sessionType).replace(/_/g, " ")}
                        </p>
                        <p className="text-slate-500">
                          {s.startTime ?? "—"} – {s.endTime ?? "—"} · {s.doctorName}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
