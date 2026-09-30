import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAdminTier } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { PageHeader, StatusBadge } from "@/components/ui/dashboard-ui";
import { formatDate, initials } from "@/lib/utils";
import { EditPatientForm } from "@/app/doctor/patients/[id]/edit/edit-form";
import { DeletePatientButton } from "@/app/doctor/patients/[id]/delete-button";

export const metadata: Metadata = { title: "Patient · Business" };

export default async function AdminPatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminTier("/admin/patients");
  const scope = await getBusinessScope();
  const { id } = await params;
  const patientId = Number(id);
  if (!Number.isInteger(patientId)) notFound();

  const [patient] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      gender: users.gender,
      dob: users.dob,
      address: users.address,
      pincode: users.pincode,
      city: users.city,
      state: users.state,
      streetAddress: users.streetAddress,
      salutation: users.salutation,
      aadhaarNo: users.aadhaarNo,
      referredBy: users.referredBy,
      profilePhotoPath: users.profilePhotoPath,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(
      and(
        eq(users.id, patientId),
        eq(users.role, "patient"),
        inArray(users.referenceRoleId, scope.doctorIds.length ? scope.doctorIds : [-1])
      )
    );
  if (!patient) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={patient.name}
        subtitle={`Registered ${formatDate(patient.createdAt)} · ${patient.status ?? "active"}`}
      />

      <div className="card mb-6 flex flex-wrap items-center gap-4 p-5">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
          {initials(patient.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">{patient.name}</p>
          <p className="text-xs text-slate-400">
            {patient.phone ?? "—"} {patient.email ? `· ${patient.email}` : ""}
          </p>
        </div>
        <StatusBadge status={patient.status ?? "active"} />
        <Link href={`/admin/appointments/book?patient=${patient.id}`} className="btn-primary !py-2 text-xs">
          <CalendarPlus className="h-3.5 w-3.5" /> Book
        </Link>
        <Link href="/admin/patients" className="btn-secondary !py-2 text-xs">
          Back to list
        </Link>
      </div>

      <EditPatientForm
        patient={{
          id: patient.id,
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
          gender: patient.gender,
          dob: patient.dob,
          address: patient.address,
          city: patient.city,
          state: patient.state,
          pincode: patient.pincode,
          streetAddress: patient.streetAddress,
          salutation: patient.salutation,
          aadhaarNo: patient.aadhaarNo,
          referredBy: patient.referredBy,
          profilePhotoPath: patient.profilePhotoPath,
        }}
      />

      <div className="mt-6 flex justify-end">
        <DeletePatientButton patientId={patient.id} patientName={patient.name} />
      </div>
    </div>
  );
}
