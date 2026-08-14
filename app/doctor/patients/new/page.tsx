import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { PatientForm } from "./patient-form";

export const metadata: Metadata = { title: "Register Patient · Doctor" };

export default async function NewPatientPage() {
  await requireRole(["doctor", "receptionist", "admin"]);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Register a patient"
        subtitle="Add a new patient to your care. A registration ID and login credentials are generated automatically."
      />
      <PatientForm />
    </div>
  );
}