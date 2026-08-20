import type { Metadata } from "next";
import Link from "next/link";
import { Video, MonitorSmartphone, Stethoscope } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getOnlineConsultations } from "@/lib/queries/doctor";
import { PageHeader, StatusBadge, EmptyState } from "@/components/ui/dashboard-ui";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Online Consultations · Doctor" };

export default async function OnlineConsultationsPage() {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
  const consultations = await getOnlineConsultations(doctorId);

  return (
    <div>
      <PageHeader
        title="Online Consultations"
        subtitle="Video and online visits for your patients"
        action={
          <Link href="/doctor/appointments/book" className="btn-primary">
            <MonitorSmartphone className="h-4 w-4" />
            Book online visit
          </Link>
        }
      />

      {consultations.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No online consultations yet"
          description="When patients book online visits, they will appear here for you to start the consultation."
        />
      ) : (
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Date & time</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {consultations.map((c) => (
                <tr key={c.id}>
                  <td>
                    <p className="font-medium text-slate-900">{c.patientName}</p>
                    <p className="text-xs text-slate-400">{c.patientPhone ?? c.mobileNumber ?? "—"}</p>
                  </td>
                  <td>
                    <p className="text-sm text-slate-700">{formatDate(c.date)}</p>
                    <p className="text-xs text-slate-400">{c.time}</p>
                  </td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/doctor/consultations/${c.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-800"
                    >
                      <Stethoscope className="h-3.5 w-3.5" />
                      Start consultation
                    </Link>
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