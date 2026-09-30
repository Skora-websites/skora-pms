import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, CalendarPlus } from "lucide-react";
import { requireAdminTier } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { getPracticeAppointments } from "@/lib/queries/doctor";
import { PageHeader, StatusBadge, EmptyState, TabPills } from "@/components/ui/dashboard-ui";
import { AppointmentRowActions } from "@/components/doctor/appointment-actions";
import { AppointmentList } from "@/components/mobile-view/appointments-list";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Appointments · Business" };

const STATUSES = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "pending_consent", label: "Awaiting consent" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await requireAdminTier("/admin/appointments");
  const scope = await getBusinessScope();
  const params = await searchParams;
  const status = params.status ?? "all";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const { rows, hasMore } = await getPracticeAppointments(
    scope.doctorIds,
    { status: status === "all" ? undefined : status },
    { page }
  );

  const pageParams = (p: number) =>
    `/admin/appointments?${new URLSearchParams({ ...(status !== "all" ? { status } : {}), ...(p > 1 ? { page: String(p) } : {}) }).toString()}`;

  return (
    <div>
      <PageHeader
        title="Appointments"
        subtitle={`Across ${scope.clinicIds.length} clinic${scope.clinicIds.length === 1 ? "" : "s"} · ${scope.doctorIds.length} doctor${scope.doctorIds.length === 1 ? "" : "s"}`}
        action={
          <Link href="/admin/appointments/book" className="btn-primary">
            <CalendarPlus className="h-4 w-4" />
            Book appointment
          </Link>
        }
      />

      <TabPills tabs={STATUSES} active={status} hrefFor={(key) => `/admin/appointments?status=${key}`} />

      {rows.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No appointments found"
          description="Appointments from every clinic in your business will appear here."
          action={{ href: "/admin/appointments/book", label: "Book appointment" }}
        />
      ) : (
        <>
          {/* Mobile: card list (no table scroll) */}
          <AppointmentList appointments={rows} editBaseHref="/admin/appointments" />
          {/* Desktop: full table with row actions */}
          <div className="table-shell mt-4 hidden sm:block">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>When</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <p className="font-semibold text-ink">{a.patientName ?? a.patientString ?? "Walk-in"}</p>
                      <p className="text-xs text-slate-400">{a.patientPhone ?? "—"}</p>
                    </td>
                    <td className="text-slate-500">
                      {formatDate(a.date)} · {a.time}
                    </td>
                    <td className="capitalize text-slate-500">{a.caseType.replace(/_/g, " ")}</td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="text-right">
                      <AppointmentRowActions
                        appointmentId={a.id}
                        status={a.status}
                        consentFile={a.consentFile}
                        editBaseHref="/admin/appointments"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {(page > 1 || hasMore) && (
        <div className="mt-4 flex items-center justify-between">
          {page > 1 ? (
            <Link href={pageParams(page - 1)} className="btn-secondary">
              Previous
            </Link>
          ) : (
            <span />
          )}
          {hasMore ? (
            <Link href={pageParams(page + 1)} className="btn-secondary">
              Next
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
