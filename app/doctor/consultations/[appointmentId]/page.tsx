import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileDown, Stethoscope, ReceiptText } from "lucide-react";
import { and, asc, eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth/guard";
import {
  getAppointmentById,
  getBillingTypes,
} from "@/lib/queries/doctor";
import { db } from "@/lib/db";
import { consultations, consultationMedications } from "@/lib/db/schema";
import { formatDate } from "@/lib/utils";
import { ConsultationForm } from "./consultation-form";
import { ConsultationBillingForm } from "../../billing/consultation-billing-form";
import { resolvePracticeDoctorId } from "@/lib/queries/doctor";

export const metadata: Metadata = { title: "Consultation · Doctor" };

export default async function ConsultationPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const user = await requireRole(["doctor", "receptionist"]);
  const doctorId = resolvePracticeDoctorId(user);
  const { appointmentId } = await params;
  const appointment = await getAppointmentById(doctorId, Number(appointmentId));
  if (!appointment) notFound();

  const [existingConsultation, billingTypes] = await Promise.all([
    db
      .select()
      .from(consultations)
      .where(
        and(
          eq(consultations.appointmentId, appointment.id),
          eq(consultations.doctorId, doctorId)
        )
      )
      .limit(1)
      .then((rows) => rows[0] ?? null),
    appointment.patientId
      ? getBillingTypes(doctorId)
      : Promise.resolve([]),
  ]);

  const existingMedications = existingConsultation
    ? await db
        .select()
        .from(consultationMedications)
        .where(eq(consultationMedications.consultationId, existingConsultation.id))
        .orderBy(asc(consultationMedications.order))
    : [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/doctor/appointments" className="mb-2 inline-block text-xs font-medium text-slate-500 hover:text-brand-700">
            ← Back to appointments
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Consultation — {appointment.patientName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {formatDate(appointment.date)} · {appointment.time} · {(appointment.caseType ?? "Appointment").replace(/_/g, " ")}
          </p>
        </div>
        {existingConsultation ? (
          <a
            href={`/api/prescriptions/${existingConsultation.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-[13px] font-semibold text-brand-800 transition-all hover:bg-brand-100"
          >
            <FileDown className="h-4 w-4" />
            Download Prescription
          </a>
        ) : null}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Patient", value: appointment.patientName },
          { label: "Date & time", value: `${formatDate(appointment.date)} · ${appointment.time}` },
          { label: "Case type", value: (appointment.caseType ?? "new").replace(/_/g, " ") },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{m.label}</p>
            <p className="mt-1 text-[15px] font-semibold capitalize text-ink">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-7 py-5">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
            <Stethoscope className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">Consultation notes</h2>
            <p className="text-xs text-slate-400">Record the visit — it will be saved to the patient&apos;s history.</p>
          </div>
        </div>
        <ConsultationForm
          appointmentId={appointment.id}
          patientId={appointment.patientId}
          bloodGroup={appointment.bloodGroup}
          bp={appointment.bp}
          weight={appointment.weight}
          height={appointment.height}
          existingConsultation={existingConsultation ? {
            id: existingConsultation.id,
            symptomsNote: existingConsultation.symptomsNote,
            examinationNote: existingConsultation.examinationNote,
            diagnosisNote: existingConsultation.diagnosisNote,
            labNote: existingConsultation.labNote,
            medicationsNote: existingConsultation.medicationsNote,
            medicalHistory: existingConsultation.medicalHistory,
            followUpDate: existingConsultation.followUpDate,
          } : null}
          existingMedications={existingMedications.map((m) => ({
            id: m.id,
            medicineName: m.medicineName,
            dose: m.dose,
            frequency: m.frequency,
            duration: m.duration,
            refills: m.refills ?? 0,
            note: m.note,
          }))}
        />
      </div>

      {appointment.patientId ? (
        <div className="mt-6 card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-7 py-5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <ReceiptText className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">Consultation billing</h2>
              <p className="text-xs text-slate-400">Create a bill for this patient after the visit.</p>
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