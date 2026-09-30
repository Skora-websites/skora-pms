import type { Metadata } from "next";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAdminTier } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
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
    scope.doctorIds.length
      ? db
          .select({ id: users.id, name: users.name, phone: users.phone })
          .from(users)
          .where(
            and(
              eq(users.role, "patient"),
              inArray(users.referenceRoleId, scope.doctorIds)
            )
          )
          .orderBy(desc(users.createdAt))
      : Promise.resolve([] as { id: number; name: string; phone: string | null }[]),
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
