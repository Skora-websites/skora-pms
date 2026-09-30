import type { Metadata } from "next";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAdminTier } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { getDoctorPatients } from "@/lib/queries/doctor";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { BookAppointmentForm } from "@/app/doctor/appointments/book/book-form";

export const metadata: Metadata = { title: "Book Appointment · Business" };

/**
 * Admin-tier booking: owners/managers book for any in-scope doctor (same
 * shared createAppointment action; the write scope validates doctor_id).
 */
export default async function AdminBookAppointmentPage() {
  await requireAdminTier("/admin/appointments");
  const scope = await getBusinessScope();

  // Patients are registered under the business's doctors (referenceRoleId);
  // the doctor dropdown covers every doctor in the business scope (not just
  // the anchor doctor's own practice).
  const [patients, doctors] = await Promise.all([
    getDoctorPatients(scope.doctorIds[0] ?? 0),
    db
      .select({
        id: users.id,
        name: users.name,
        salutation: users.salutation,
        qualification: users.qualification,
      })
      .from(users)
      .where(
        and(
          eq(users.role, "doctor"),
          inArray(users.id, scope.doctorIds.length ? scope.doctorIds : [-1])
        )
      )
      .orderBy(asc(users.id)),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Book appointment" subtitle="Schedule a new appointment for a patient at one of your clinics." />
      <BookAppointmentForm patients={patients} doctors={doctors} />
    </div>
  );
}
