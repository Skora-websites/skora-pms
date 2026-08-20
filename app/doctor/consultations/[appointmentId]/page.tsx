import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileDown, Stethoscope, ReceiptText } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import {
  getAppointmentById,
  getConsultationIdByAppointment,
  getBillingTypes,
} from "@/lib/queries/doctor";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { ConsultationForm } from "./consultation-form";
import { ConsultationBillingForm } from "../../billing/consultation-billing-form";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}): Promise<Metadata> {
  const { appointmentId } = await params;
  return { title: `Consultation #${appointmentId} · Doctor` };
}

export default async function ConsultationPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
  const { appointmentId } = await params;
  const appointment = await getAppointmentById(doctorId, Number(appointmentId));
  if (!appointment) notFound();

  const [consultationId, billingTypes] = await Promise.all([
    getConsultationIdByAppointment(doctorId, appointment.id),
    getBillingTypes(doctorId),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Start consultation"
        subtitle={
          <>
            <Link href="/doctor/appointments" className="text-brand-800 hover:underline">
              ← Appointments
            </Link>
          </>
        }
        action={
          consultationId ? (
            <a
              href={`/api/prescriptions/${consultationId}`}
              className="btn-secondary"
            >
              <FileDown className="h-4 w-4" />
              Download prescription PDF
            </a>
          ) : undefined
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Patient", value: appointment.patientName },
          { label: "Date & time", value: `${formatDate(appointment.date)} · ${appointment.time}` },
          { label: "Visit type", value: appointment.caseType.replace(/_/g, " ") },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{s.label}</p>
            <p className="mt-1 truncate font-semibold capitalize text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card p-7">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
            <Stethoscope className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">Consultation notes</h2>
            <p className="text-xs text-slate-400">Record the visit — it will be saved to the patient&apos;s history.</p>
          </div>
        </div>
        <ConsultationForm
          appointmentId={appointment.id}
          patientId={appointment.patientId ?? 0}
          hasPatient={Boolean(appointment.patientId)}
          bloodGroup={appointment.bloodGroup}
          bp={appointment.bp}
          weight={appointment.weight}
          height={appointment.height}
        />
      </div>

      {appointment.patientId ? (
        <div className="card mt-6 p-7">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 text-accent-700">
              <ReceiptText className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">Billing</h2>
              <p className="text-xs text-slate-400">
                Generate a bill for this consultation. It will also sync to your income ledger.
              </p>
            </div>
          </div>
          <ConsultationBillingForm
            appointmentId={appointment.id}
            patientId={appointment.patientId}
            billingTypes={billingTypes.map((t) => ({ id: t.id, name: t.name, defaultAmount: t.defaultAmount }))}
          />
        </div>
      ) : null}
    </div>
  );
}
