import type { Metadata } from "next";
import { requireAdminTier } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { listPatientOptions, listScopeDoctors } from "@/lib/queries/admin";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { BookAppointmentForm } from "@/app/doctor/appointments/book/book-form";

export const metadata: Metadata = { title: "Book Appointment · Business" };

/**
 * Admin-tier booking: owners/managers book for any in-scope doctor (same
 * shared createAppointment action; the write scope validates doctor_id).
 */
export default async function AdminBookAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string }>;
}) {
  await requireAdminTier("/admin/appointments");
  const scope = await getBusinessScope();

  // Patients across the business: owned by ANY scoped doctor via the
  // reference_role_id semantic (fanned over scope.doctorIds, same as the
  // admin registrations list) — anchoring on doctorIds[0] alone would omit
  // patients of the business's other doctors from the dropdown entirely.
  const [patients, doctors] = await Promise.all([
    listPatientOptions(scope.doctorIds),
    listScopeDoctors(scope.doctorIds),
  ]);

  // Preselect support: "Book" on an admin patient page links here with
  // ?patient=<id>; only honor it when the patient is in business scope.
  const raw = (await searchParams).patient;
  const wanted = Number(raw);
  const preselectedPatientId =
    raw && Number.isInteger(wanted) && patients.some((p) => p.id === wanted)
      ? wanted
      : null;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Book appointment" subtitle="Schedule a new appointment for a patient at one of your clinics." />
      <BookAppointmentForm patients={patients} doctors={doctors} preselectedPatientId={preselectedPatientId} />
    </div>
  );
}
