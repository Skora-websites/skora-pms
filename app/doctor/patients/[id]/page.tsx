import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarPlus, Phone, Mail, MapPin, Stethoscope } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getPatientById } from "@/lib/queries/doctor";
import { StatusBadge } from "@/components/ui/dashboard-ui";
import { formatDate, initials } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Patient #${id} · Doctor` };
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
  const { id } = await params;
  const data = await getPatientById(doctorId, Number(id));
  if (!data) notFound();

  const { patient, appointments, consultations } = data;

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/doctor/patients"
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-800 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> All patients
      </Link>

      {/* Profile card */}
      <div className="card overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-brand-800 to-accent-700" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-wrap items-end gap-4">
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-brand-700 to-accent-600 font-display text-xl font-bold text-white shadow-lg">
              {initials(patient.name)}
            </span>
            <div className="pb-1">
              <h1 className="font-display text-2xl font-extrabold text-slate-900">{patient.name}</h1>
              <p className="text-sm text-slate-400">
                Patient · {patient.gender ? <span className="capitalize">{patient.gender}</span> : "—"}
                {patient.dob ? ` · ${patient.dob}` : ""}
              </p>
            </div>
            <div className="ml-auto flex gap-2 pb-1">
              <a href={`tel:${patient.phone}`} className="btn-secondary !py-2 text-xs">
                <Phone className="h-3.5 w-3.5" /> Call
              </a>
              {patient.email && (
                <a href={`mailto:${patient.email}`} className="btn-secondary !py-2 text-xs">
                  <Mail className="h-3.5 w-3.5" /> Email
                </a>
              )}
              <Link href="/doctor/appointments/book" className="btn-primary !py-2 text-xs">
                <CalendarPlus className="h-3.5 w-3.5" /> Book
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3.5">
              <Phone className="h-4 w-4 text-brand-700" />
              <div>
                <p className="text-xs text-slate-400">Phone</p>
                <p className="text-sm font-semibold text-slate-900">{patient.phone ?? "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3.5">
              <Mail className="h-4 w-4 text-brand-700" />
              <div>
                <p className="text-xs text-slate-400">Email</p>
                <p className="truncate text-sm font-semibold text-slate-900">{patient.email ?? "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3.5">
              <MapPin className="h-4 w-4 text-brand-700" />
              <div>
                <p className="text-xs text-slate-400">Location</p>
                <p className="text-sm font-semibold text-slate-900">
                  {[patient.city, patient.state].filter(Boolean).join(", ") || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments */}
      <h2 className="mb-3 mt-8 font-display text-lg font-bold text-slate-900">Appointment history</h2>
      <div className="table-shell">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Visit type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 && (
              <tr><td colSpan={4} className="py-8 text-center text-slate-400">No appointments yet.</td></tr>
            )}
            {appointments.map((a) => (
              <tr key={a.id}>
                <td>{formatDate(a.date)}</td>
                <td>{a.time}</td>
                <td className="capitalize">{a.caseType.replace(/_/g, " ")}</td>
                <td><StatusBadge status={a.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Consultations */}
      <h2 className="mb-3 mt-8 font-display text-lg font-bold text-slate-900">Consultation history</h2>
      <div className="space-y-3">
        {consultations.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
            No consultations recorded yet.
          </p>
        )}
        {consultations.map((c) => (
          <div key={c.id} className="card flex flex-wrap items-center gap-4 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
              <Stethoscope className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">
                {formatDate(c.consultationDate)}
                {c.followUpDate ? ` · Follow-up ${c.followUpDate}` : ""}
              </p>
              <p className="truncate text-sm text-slate-400">
                {c.diagnosisNote || c.symptomsNote || "Consultation notes"}
              </p>
            </div>
            {c.followUpDate && <StatusBadge status={c.followUpStatus ?? "pending"} />}
          </div>
        ))}
      </div>
    </div>
  );
}
