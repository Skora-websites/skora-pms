import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Phone, BadgeCheck, GraduationCap, Mail } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getDoctorDetails } from "@/lib/queries/super-admin";
import { PageHeader, StatusBadge } from "@/components/ui/dashboard-ui";
import { formatDate, formatINR, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Doctor Details · Super Admin" };
export const dynamic = "force-dynamic";

export default async function DoctorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["super_admin", "admin"]);
  const { id } = await params;
  const doctorId = Number(id);
  if (!doctorId || !Number.isInteger(doctorId)) notFound();
  const data = await getDoctorDetails(doctorId);
  if (!data) notFound();
  const { doctor, clinics } = data;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={doctor.name}
        subtitle={`Doctor profile · ${formatDate(doctor.createdAt)}`}
        action={
          <Link href="/super-admin/doctors" className="btn-secondary">
            <ArrowLeft className="h-4 w-4" />
            Back to doctors
          </Link>
        }
      />

      <div className="card overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-brand-800 to-accent-700" />
        <div className="px-7 pb-7">
          <div className="-mt-10 flex items-end gap-4">
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-brand-700 to-accent-600 font-display text-2xl font-bold text-white shadow-lg">
              {initials(doctor.name)}
            </span>
            <div className="pb-1">
              <h1 className="font-display text-xl font-extrabold text-slate-900">{doctor.name}</h1>
              <div className="mt-1"><StatusBadge status={doctor.status ?? "active"} /></div>
            </div>
            {doctor.trialEndsAt && (
              <div className="ml-auto pb-1 text-right">
                <p className="text-xs text-slate-400">Trial ends</p>
                <p className="text-sm font-semibold text-slate-700">{formatDate(doctor.trialEndsAt)}</p>
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <InfoRow icon={Mail} label="Email" value={doctor.email ?? "—"} />
            <InfoRow icon={Phone} label="Phone" value={doctor.phone ?? "—"} />
            <InfoRow icon={GraduationCap} label="Qualification" value={doctor.qualification ?? "—"} />
            <InfoRow icon={BadgeCheck} label="Registration number" value={doctor.registrationNumber ?? "—"} />
          </div>
        </div>
      </div>

      {/* Clinics */}
      <div className="mt-6">
        <h2 className="mb-3 font-display text-base font-bold text-slate-900">
          Clinics ({clinics.length})
        </h2>
        {clinics.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
            No clinics added yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {clinics.map((c) => (
              <div key={c.id} className="card p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">{c.clinicName}</h3>
                  <StatusBadge status={c.isActive ? "active" : "inactive"} />
                </div>
                <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                  <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {c.address}</p>
                  <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {c.phone}</p>
                  <p className="font-semibold text-slate-700">{formatINR(c.consultationFee)} / visit</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm ring-1 ring-slate-100">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}