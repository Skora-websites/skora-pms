import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { getDoctorPatients } from "@/lib/queries/doctor";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { BookAppointmentForm } from "./book-form";

export const metadata: Metadata = { title: "Book Appointment · Doctor" };

export default async function BookAppointmentPage() {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
  const patients = await getDoctorPatients(doctorId);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Book appointment" subtitle="Schedule a new appointment for a patient." />
      <BookAppointmentForm patients={patients} />
    </div>
  );
}
