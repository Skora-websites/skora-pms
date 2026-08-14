import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { requireRole } from "@/lib/auth/guard";
import { getPatientById } from "@/lib/queries/doctor";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { EditPatientForm } from "./edit-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Edit Patient #${id} · Doctor` };
}

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) notFound();

  const data = await getPatientById(doctorId, numericId);
  if (!data) notFound();
  const { patient } = data;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/doctor/patients/${patient.id}`}
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-800 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> Back to patient
      </Link>
      <PageHeader
        title={`Edit ${patient.name}`}
        subtitle={`Registration ID: ${patient.registrationId ?? "—"}`}
      />
      <EditPatientForm patient={patient} />
    </div>
  );
}