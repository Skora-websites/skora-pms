import type { Metadata } from "next";
import { Home, MapPin, Phone, CalendarDays } from "lucide-react";
import { requireAdminTier } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { getHomeVisits } from "@/lib/queries/doctor";
import { PageHeader, StatusBadge, EmptyState } from "@/components/ui/dashboard-ui";
import { formatDate, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Home Visits · Business" };

function mapsUrl(city: string | null, state: string | null) {
  const q = [city, state].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q || "India")}`;
}

/**
 * Business-owner home visits (D1 owner-parity): the doctor dashboard's
 * home-visit list scoped to every doctor in the owner's business.
 */
export default async function AdminHomeVisitsPage() {
  await requireAdminTier("/admin/home-visits");
  const scope = await getBusinessScope();
  const visits = await getHomeVisits(scope.doctorIds);

  return (
    <div>
      <PageHeader
        title="Home Visits"
        subtitle={`Scheduled home-visit appointments across your business (${scope.doctorIds.length} doctor${scope.doctorIds.length === 1 ? "" : "s"} in scope)`}
      />

      {visits.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No home visits scheduled"
          description="Home-visit appointments booked at your clinics will appear here."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="slim-scroll overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-medium text-slate-500">
                  <th className="px-5 py-3.5">Patient</th>
                  <th className="px-5 py-3.5">Visit Date</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5">Status</th>
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
                          <span className="font-semibold text-slate-800">{v.patientName}</span>
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
                        className="inline-flex max-w-full items-center gap-1.5 text-brand-800 hover:underline"
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
