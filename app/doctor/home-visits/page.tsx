import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, ClipboardList, Home, Phone, CalendarDays } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getHomeVisits } from "@/lib/queries/doctor";
import { PageHeader, StatusBadge, EmptyState } from "@/components/ui/dashboard-ui";
import { formatDate, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Home Visits · Doctor" };

function mapsUrl(city: string | null, state: string | null) {
  const q = [city, state].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q || "India")}`;
}

export default async function HomeVisitsPage() {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
  const visits = await getHomeVisits(doctorId);

  return (
    <div>
      <PageHeader
        title="Home Visits"
        subtitle={`Scheduled home-visit appointments for your practice`}
        action={
          <Link href="/doctor/appointments/book" className="btn-primary">
            <Home className="h-4 w-4" />
            Book a home visit
          </Link>
        }
      />

      {visits.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No home visits scheduled"
          description="When you book appointments with 'Home Visit' as the case type, they appear here with patient details and map directions."
          action={{ href: "/doctor/appointments/book", label: "Book first home visit" }}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="slim-scroll overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3.5">Patient</th>
                  <th className="px-5 py-3.5">Visit Date</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {visits.map((v) => (
                  <tr key={v.id} className="transition-colors hover:bg-brand-50/40">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                          {initials(v.patientName)}
                        </span>
                        <div className="min-w-0">
                          {v.patientId ? (
                            <Link
                              href={`/doctor/patients/${v.patientId}`}
                              className="font-semibold text-slate-800 hover:text-brand-800"
                            >
                              {v.patientName}
                            </Link>
                          ) : (
                            <span className="font-semibold text-slate-800">{v.patientName}</span>
                          )}
                          <p className="flex items-center gap-1 text-xs text-slate-400">
                            <Phone className="h-3 w-3" />
                            {v.patientPhone ?? "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <p className="flex items-center gap-1.5 font-medium text-slate-700">
                        <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                        {formatDate(v.date)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">{v.time}</p>
                    </td>
                    <td className="max-w-[260px] px-5 py-4">
                      <a
                        href={mapsUrl(v.patientCity, v.patientState)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex max-w-full items-center gap-1.5 text-brand-800 hover:underline"
                      >
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {[v.patientCity, v.patientState].filter(Boolean).join(", ") || "View on map"}
                        </span>
                      </a>
                      {v.notes && <p className="mt-1 truncate text-xs text-slate-400">“{v.notes}”</p>}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/doctor/consultations/${v.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-800 transition-colors hover:bg-brand-50"
                      >
                        <ClipboardList className="h-3.5 w-3.5" />
                        Consult
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
