import type { Metadata } from "next";
import Link from "next/link";
import { Stethoscope, MapPin, IndianRupee, BadgeCheck, CalendarPlus } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getAvailableDoctors } from "@/lib/queries/patient";
import { PageHeader, EmptyState } from "@/components/ui/dashboard-ui";
import { formatINR, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Find a Doctor · Patient" };
export const dynamic = "force-dynamic";

export default async function FindDoctorPage() {
  await requireRole(["patient"]);
  const doctors = await getAvailableDoctors();

  return (
    <div>
      <PageHeader
        title="Find a doctor"
        subtitle="Browse doctors accepting online bookings"
      />

      {doctors.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No doctors available"
          description="Doctors will appear here when they open bookings."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {doctors.map((d) => (
            <div key={d.id} className="card p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-accent-600 font-display text-lg font-bold text-white shadow">
                  {d.profilePhotoPath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/doctors/${d.id}/photo`} alt={d.name} className="h-full w-full object-cover" />
                  ) : (
                    initials(d.name)
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-base font-bold text-slate-900">
                    {d.salutation ? `${d.salutation} ` : ""}{d.name}
                  </h2>
                  {d.qualification && <p className="text-xs font-medium text-brand-800">{d.qualification}</p>}
                  <div className="mt-2 space-y-1 text-xs text-slate-500">
                    {d.clinicName && <p className="flex items-center gap-1.5"><Stethoscope className="h-3.5 w-3.5 text-slate-400" /> {d.clinicName}</p>}
                    {(d.clinicAddress || d.city) && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {d.clinicAddress ?? d.city}{d.city ? `, ${d.city}` : ""}
                      </p>
                    )}
                    {d.registrationNumber && (
                      <p className="flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5 text-slate-400" /> Reg. {d.registrationNumber}</p>
                    )}
                    {d.consultationFee && (
                      <p className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <IndianRupee className="h-3.5 w-3.5 text-slate-400" /> Consultation {formatINR(d.consultationFee)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
                <Link
                  href={`/patient/appointments/book?doctor=${d.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
                >
                  <CalendarPlus className="h-4 w-4" /> Book appointment
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}