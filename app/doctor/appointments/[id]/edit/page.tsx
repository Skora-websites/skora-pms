import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guard";
import { getAppointmentById, getDoctorPatients } from "@/lib/queries/doctor";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { EditAppointmentForm } from "./edit-form";

export const metadata: Metadata = { title: "Edit Appointment · Doctor" };

/** "h:mm AM/PM" (legacy) -> "HH:MM" (24h) for the <input type="time">. */
function to24hTime(time: string | null): string {
  if (!time) return "";
  const m = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return "";
  let h = Number(m[1]);
  const min = m[2];
  const meridiem = m[3]?.toUpperCase();
  if (meridiem === "PM" && h !== 12) h += 12;
  if (meridiem === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${min}`;
}

export default async function EditAppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
  const { id } = await params;

  const appointmentId = Number(id);
  if (!Number.isInteger(appointmentId)) notFound();

  const appointment = await getAppointmentById(doctorId, appointmentId);
  if (!appointment) notFound();

  const patients = await getDoctorPatients(doctorId);

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
