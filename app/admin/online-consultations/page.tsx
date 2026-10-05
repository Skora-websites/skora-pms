import type { Metadata } from "next";
import { Video } from "lucide-react";
import { requireAdminTier } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { getPracticeOnlineConsultations } from "@/lib/queries/doctor";
import { TabPills, PageHeader, StatusBadge, EmptyState } from "@/components/ui/dashboard-ui";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Online Consultations · Business" };

/**
 * Business-owner online consultations (D1 owner-parity): status-tabbed,
 * read-only view of online visits across the business's doctors. Starting
 * the video consultation stays with the treating doctor.
 */
export default async function AdminOnlineConsultationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdminTier("/admin/online-consultations");
  const scope = await getBusinessScope();
  const params = await searchParams;
  const status = params.status ?? "all";

  const { rows: consultations } = await getPracticeOnlineConsultations(scope.doctorIds, { status });

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
        title="Online Consultations"
        subtitle="Video and online visits across your business"
      />

      <TabPills
        tabs={tabs}
        active={status}
        hrefFor={(key) => `/admin/online-consultations?status=${key}`}
      />

      {consultations.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No online consultations yet"
          description="Online visits booked at your clinics will appear here."
        />
      ) : (
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Date & time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {consultations.map((c) => (
                <tr key={c.id}>
                  <td>
                    <p className="font-medium text-ink">{c.patientName}</p>
                    <p className="text-xs text-slate-400">{c.patientPhone ?? c.mobileNumber ?? "—"}</p>
                  </td>
                  <td>
                    <p className="text-sm text-slate-700">{formatDate(c.date)}</p>
                    <p className="text-xs text-slate-400">{c.time}</p>
                  </td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
