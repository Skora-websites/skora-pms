import type { Metadata } from "next";
import { requireAdminTier } from "@/lib/auth/guard";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { PatientForm } from "@/app/doctor/patients/new/patient-form";

export const metadata: Metadata = { title: "Register Patient · Business" };

/** Admin-tier patient registration — same shared createPatient action. */
export default async function AdminNewPatientPage() {
  await requireAdminTier("/admin/patients");
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Register patient" subtitle="Add a new patient under one of your clinics." />
      <PatientForm />
    </div>
  );
}
