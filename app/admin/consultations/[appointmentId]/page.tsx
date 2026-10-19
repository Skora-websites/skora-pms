import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminTier } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { PageHeader, EmptyState } from "@/components/ui/dashboard-ui";
import { Stethoscope } from "lucide-react";
import { ConsultationDetailView } from "./consultation-detail-view";
import { getConsultationRecordForAdmin } from "./actions";

export const metadata: Metadata = { title: "Consultation · Business" };

/**
 * Business-owner consultation detail (audit H6).
 *
 * `/admin/consultations` used to link "View" at
 * `/doctor/consultations/[appointmentId]`, which the doctor layout rejects for
 * the admin/manager tier — so the owner was bounced out of their own panel.
 * This route serves the same record inside /admin, read-only: the clinical
 * completion flow stays with the doctor (per the module's stated intent).
 */
export default async function AdminConsultationDetailPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  await requireAdminTier("/admin/consultations");

  const { appointmentId } = await params;
  const id = Number(appointmentId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const { doctorIds } = await getBusinessScope();
  if (doctorIds.length === 0) {
    return (
      <>
        <PageHeader title="Consultation" />
        <EmptyState
          icon={Stethoscope}
          title="No clinic is assigned"
          description="This account has no clinics, so there is nothing to review yet."
        />
      </>
    );
  }

  const record = await getConsultationRecordForAdmin(id, doctorIds);
  if (!record) notFound();

  return (
    <>
      <PageHeader
        title={record.patientName}
        subtitle={`Consultation record · ${record.consultationDate ?? "—"}`}
      />
      <ConsultationDetailView record={record} />
    </>
  );
}
