import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { getDoctorPatients, resolvePracticeDoctorId } from "@/lib/queries/doctor";
import { getPracticeDoctors } from "@/lib/queries/clinic";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { BookAppointmentForm } from "./book-form";

export const metadata: Metadata = { title: "Book Appointment · Doctor" };

export default async function BookAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string }>;
}) {
  const user = await requireRole(["doctor", "receptionist"]);
  // Patients are registered under the practice owner (referenceRoleId),
  // which resolvePracticeDoctorId already maps staff users to.
  const doctorId = resolvePracticeDoctorId(user);
  const patients = await getDoctorPatients(doctorId);

  // Preselect support: "Book" buttons on a patient's page link here with
  // ?patient=<id> so the form opens with that patient already chosen. Only
  // trust the id if it is one of the caller's own patients.
  const raw = (await searchParams).patient;
  const wanted = Number(raw);
  const preselectedPatientId =
    raw && Number.isInteger(wanted) && patients.some((p) => p.id === wanted)
      ? wanted
      : null;

  // Receptionists pick which practice doctor the appointment is for; doctors
  // book for themselves (no picker).
  const isReceptionist = user.role === "receptionist";
  const doctors = isReceptionist ? await getPracticeDoctors(doctorId) : [];

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Book appointment" subtitle="Schedule a new appointment for a patient." />
      <BookAppointmentForm patients={patients} doctors={doctors} preselectedPatientId={preselectedPatientId} />
    </div>
  );
}
