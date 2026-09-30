import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { getDoctorPatients, resolvePracticeDoctorId } from "@/lib/queries/doctor";
import { getPracticeDoctors } from "@/lib/queries/clinic";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { BookAppointmentForm } from "./book-form";

export const metadata: Metadata = { title: "Book Appointment · Doctor" };

export default async function BookAppointmentPage() {
  const user = await requireRole(["doctor", "receptionist"]);
  // Patients are registered under the practice owner (referenceRoleId),
  // which resolvePracticeDoctorId already maps staff users to.
  const doctorId = resolvePracticeDoctorId(user);
  const patients = await getDoctorPatients(doctorId);

  // Receptionists pick which practice doctor the appointment is for; doctors
  // book for themselves (no picker).
  const isReceptionist = user.role === "receptionist";
  const doctors = isReceptionist ? await getPracticeDoctors(doctorId) : [];

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Book appointment" subtitle="Schedule a new appointment for a patient." />
      <BookAppointmentForm patients={patients} doctors={doctors} />
    </div>
  );
}
