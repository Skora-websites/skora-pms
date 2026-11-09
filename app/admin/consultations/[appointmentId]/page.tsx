import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminTier } from "@/lib/auth/guard";
import { PageHeader } from "@/components/ui/dashboard-ui";
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

  const record = await getConsultationRecordForAdmin(id);
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
