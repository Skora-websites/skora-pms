import type { Metadata } from "next";
import Link from "next/link";
import { CalendarPlus, CalendarDays } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import {
  getPracticeAppointments,
  resolvePracticeDoctorId,
} from "@/lib/queries/doctor";
import { listDoctorIdsFor } from "@/lib/queries/clinic";
import { PageHeader, StatusBadge, EmptyState, TabPills } from "@/components/ui/dashboard-ui";
import { AppointmentRowActions } from "@/components/doctor/appointment-actions";
import { AppointmentList } from "@/components/mobile-view/appointments-list";
import { ExportAppointmentsButton } from "./export-button";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Appointments · Doctor" };

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; date?: string; page?: string }>;
}) {
  const user = await requireRole(["doctor", "receptionist"]);
  const doctorId = resolvePracticeDoctorId(user);
  const params = await searchParams;
  const filter = { status: params.status ?? "all", date: params.date };
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  // Scope: clinic-owner doctors + their receptionists see the whole
  // practice's appointments; a member doctor sees strictly their own —
  // never a peer's. listDoctorIdsFor collapses to [ownId] for members.
  const doctorIds = await listDoctorIdsFor(user, doctorId);
  const { rows: appointments, hasMore } =
    await getPracticeAppointments(doctorIds, filter, { page });
  const pageParams = (p: number) =>
    `/doctor/appointments?${new URLSearchParams({
      ...(filter.status !== "all" ? { status: filter.status } : {}),
      ...(filter.date ? { date: filter.date } : {}),
      ...(p > 1 ? { page: String(p) } : {}),
    }).toString()}`;

  const tabs = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "pending_consent", label: "Pending consent" },
    { key: "confirmed", label: "Confirmed" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <div>
      <PageHeader
        title="Appointments"
        subtitle={`${appointments.length} on this page${hasMore ? " · more available" : ""}`}
        action={
          <div className="flex items-center gap-2">
            <ExportAppointmentsButton status={params.status} />
            <Link href="/doctor/appointments/book" className="btn-primary">
              <CalendarPlus className="h-4 w-4" />
              Book appointment
            </Link>
          </div>
        }
      />

      <TabPills
        tabs={tabs}
        active={filter.status ?? "all"}
        hrefFor={(key) =>
          `/doctor/appointments?status=${key}${filter.date ? `&date=${filter.date}` : ""}`
        }
      />

      {/* Date filter (GET form) — combined with the status pills above. */}
      <form method="get" action="/doctor/appointments" className="mb-5 flex flex-wrap items-center gap-2">
        {filter.status && filter.status !== "all" && (
          <input type="hidden" name="status" value={filter.status} />
        )}
        <input
          type="date"
          name="date"
          defaultValue={filter.date ?? ""}
          className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[13px] text-slate-700 focus:border-brand-400 focus:outline-none"
          aria-label="Filter by date"
        />
        <button
          type="submit"
          className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:border-brand-300 hover:text-brand-800"
        >
          Filter
        </button>
        {(filter.date || (filter.status && filter.status !== "all")) && (
          <a
            href="/doctor/appointments"
            className="rounded-full px-3 py-1.5 text-[13px] font-medium text-slate-400 transition-colors hover:text-brand-800"
          >
            Clear
          </a>
        )}
      </form>

      {appointments.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No appointments here"
          description="Try a different filter or book a new appointment."
          action={{ href: "/doctor/appointments/book", label: "Book appointment" }}
        />
      ) : (
        <>
          {/* Mobile: card list (no table scroll) */}
          <AppointmentList appointments={appointments} />
          {/* Desktop: full table */}
          <div className="hidden sm:block">
            <div className="table-shell">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Visit type</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <p className="font-semibold text-ink">{a.patientName}</p>
                        <p className="text-xs text-slate-400">{a.mobileNumber ?? a.patientPhone ?? ""}</p>
                      </td>
                      <td>{formatDate(a.date)}</td>
                      <td>{a.time}</td>
                      <td className="capitalize">{a.caseType.replace(/_/g, " ")}</td>
                      <td><StatusBadge status={a.status} /></td>
                      <td className="text-right">
                        <AppointmentRowActions
                          appointmentId={a.id}
                          status={a.status}
                          consentFile={a.consentFile}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {(page > 1 || hasMore) && (
        <div className="mt-5 flex items-center justify-center gap-3">
          {page > 1 && (
            <Link
              href={pageParams(page - 1)}
              className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-800"
            >
              Previous
            </Link>
          )}
          {hasMore && (
            <Link
              href={pageParams(page + 1)}
              className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-800"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
