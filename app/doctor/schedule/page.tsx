import type { Metadata } from "next";
import { CalendarClock, MapPin, Clock } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getClinicsWithSchedules } from "@/lib/queries/doctor";
import { PageHeader, EmptyState } from "@/components/ui/dashboard-ui";

export const metadata: Metadata = { title: "Schedule · Doctor" };

const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const SESSION_STYLES: Record<string, string> = {
  morning: "bg-amber-100 text-amber-800",
  afternoon: "bg-brand-100 text-brand-800",
  evening: "bg-violet-100 text-violet-800",
  night: "bg-navy-950 text-accent-300",
  full_day: "bg-accent-100 text-accent-800",
};

export default async function SchedulePage() {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
  const clinics = await getClinicsWithSchedules(doctorId);

  return (
    <div>
      <PageHeader
        title="Schedule time"
        subtitle="Weekly OPD schedule across your clinics"
      />

      {clinics.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No clinics set up yet"
          description="Add a clinic from the schedule settings to start defining weekly working hours."
        />
      ) : (
        <div className="space-y-8">
          {clinics.map((clinic) => (
            <div key={clinic.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 to-accent-600 text-white">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900">{clinic.clinicName}</h2>
                  <p className="text-xs text-slate-400">{clinic.address}</p>
                </div>
                <span className="badge ml-auto bg-accent-100 text-accent-800">
                  ₹{Number(clinic.consultationFee ?? 0).toLocaleString("en-IN")} / visit
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {DAY_ORDER.map((day) => {
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
                            className="flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100"
                          >
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                              <Clock className="h-3.5 w-3.5 text-brand-700" />
                              {s.startTime} – {s.endTime}
                            </span>
                            <span className={`badge ${SESSION_STYLES[s.sessionType] ?? "bg-slate-100 text-slate-600"}`}>
                              {s.sessionType.replace(/_/g, " ")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
