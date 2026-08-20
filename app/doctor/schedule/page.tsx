import type { Metadata } from "next";
import Image from "next/image";
import { CalendarClock, MapPin, Clock, Phone, Wallet, CalendarRange } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getClinicsWithSchedules } from "@/lib/queries/doctor";
import { PageHeader, EmptyState } from "@/components/ui/dashboard-ui";
import { AddClinicForm } from "./add-clinic-form";
import { ClinicCardActions } from "./clinic-card-actions";
import { ScheduleManager } from "./schedule-manager";
import { WorkingHoursCard } from "./working-hours-card";

export const metadata: Metadata = { title: "Schedule · Doctor" };

export default async function SchedulePage() {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
  const clinics = await getClinicsWithSchedules(doctorId);

  const weekSummary = (() => {
    const byDay = new Map<string, { count: number; minutes: number }>();
    for (const clinic of clinics) {
      for (const s of clinic.schedules) {
        const cur = byDay.get(s.dayOfWeek) ?? { count: 0, minutes: 0 };
        byDay.set(s.dayOfWeek, {
          count: cur.count + 1,
          minutes: cur.minutes + (s.is24Hours ? 24 * 60 : (s.durationHours ?? 0) * 60 + (s.durationMinutes ?? 0)),
        });
      }
    }
    return byDay;
  })();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <PageHeader
            title="Schedule time"
            subtitle="Weekly OPD schedule across your clinics"
          />
        </div>
        <AddClinicForm />
      </div>

      {/* Working hours view */}
      {clinics.length > 0 && (
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {weekSummary.size === 0 && (
            <WorkingHoursCard
              icon={CalendarRange}
              day="This week"
              title="No working hours set"
              subtitle="Add a schedule slot to a clinic to define your weekly OPD hours."
            />
          )}
          {Array.from(weekSummary.entries()).map(([day, info]) => {
            const hours = Math.floor(info.minutes / 60);
            const mins = info.minutes % 60;
            return (
              <WorkingHoursCard
                key={day}
                icon={CalendarRange}
                day={day}
                title={`${info.count} session${info.count === 1 ? "" : "s"}`}
                subtitle={`${hours}h ${mins.toString().padStart(2, "0")}m per week`}
              />
            );
          })}
        </div>
      )}

      {clinics.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No clinics set up yet"
          description="Add your clinic details to start defining weekly working hours and consultation fees."
        />
      ) : (
        <div className="space-y-8">
          {clinics.map((clinic) => (
            <div key={clinic.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                {clinic.clinicLogo ? (
                  <Image
                    src={`/api/doctor/clinic-logo/${clinic.id}`}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-xl object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 to-accent-600 text-white">
                    <MapPin className="h-5 w-5" />
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-base font-bold text-slate-900">{clinic.clinicName}</h2>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {clinic.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Wallet className="h-3 w-3" />
                      ₹{Number(clinic.consultationFee ?? 0).toLocaleString("en-IN")} / visit
                    </span>
                  </div>
                </div>
                <ClinicCardActions clinic={clinic} />
              </div>

              <div className="p-6">
                {/* Schedule grid */}
                <div className="mb-6">
                  <h3 className="mb-3 text-sm font-semibold text-slate-700">Weekly schedule</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => {
                      const daySchedules = clinic.schedules.filter((s) => s.dayOfWeek === day);
                      return (
                        <div
                          key={day}
                          className={`rounded-2xl border p-4 ${
                            daySchedules.length ? "border-brand-100 bg-brand-50/40" : "border-dashed border-slate-200"
                          }`}
                        >
                          <p className="font-display text-sm font-bold capitalize text-slate-900">{day}</p>
                          <div className="mt-3 space-y-2">
                            {daySchedules.length === 0 && (
                              <p className="text-xs text-slate-400">—</p>
                            )}
                            {daySchedules.map((s) => (
                              <div
                                key={s.id}
                                className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100"
                              >
                                <Clock className="h-3.5 w-3.5 text-brand-700 shrink-0" />
                                <div className="min-w-0">
                                  <span className="block text-xs font-semibold text-slate-700">
                                    {s.startTime} – {s.endTime}
                                  </span>
                                  <span className="block text-[11px] text-slate-500">
                                    {s.sessionType.replace(/_/g, " ")}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Schedule manager */}
                <ScheduleManager clinicId={clinic.id} existingSchedules={clinic.schedules} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
