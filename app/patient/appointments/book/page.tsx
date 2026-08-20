import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { getAvailableDoctors } from "@/lib/queries/patient";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { BookAppointmentForm } from "./book-form";

export const metadata: Metadata = { title: "Book Appointment · Patient" };

export default async function PatientBookAppointmentPage() {
  await requireRole(["patient"]);
  const doctors = await getAvailableDoctors();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Book an appointment"
        subtitle="Pick a doctor and an available time slot"
      />
      <BookAppointmentForm doctors={doctors} />
    </div>
  );
}