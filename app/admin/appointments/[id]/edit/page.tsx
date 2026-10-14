import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminTier } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { getAppointmentInPractice, getDoctorPatients } from "@/lib/queries/doctor";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { EditAppointmentForm } from "@/app/doctor/appointments/[id]/edit/edit-form";
import { to24hTime } from "./time";

export const metadata: Metadata = { title: "Edit Appointment · Business" };

export default async function AdminEditAppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminTier("/admin/appointments");
  const scope = await getBusinessScope();
  const { id } = await params;

  const appointmentId = Number(id);
  if (!Number.isInteger(appointmentId)) notFound();

  // Scope-aware fetch: any in-scope doctor's appointment is editable.
  const appointment = await getAppointmentInPractice(scope.doctorIds, appointmentId);
  if (!appointment) notFound();

  const patients = await getDoctorPatients(scope.doctorIds[0] ?? 0);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Edit appointment" subtitle="Update the appointment details." />
      <EditAppointmentForm
        appointment={{
          id: appointment.id,
          patientId: appointment.patientId,
          patientString: appointment.patientString,
          date: appointment.date,
          time: to24hTime(appointment.time),
          caseType: appointment.caseType,
          bloodGroup: appointment.bloodGroup,
          bp: appointment.bp,
          weight: appointment.weight,
          height: appointment.height,
          remarks: appointment.remarks,
          mobileNumber: appointment.mobileNumber,
        }}
        patients={patients}
      />
    </div>
  );
}
