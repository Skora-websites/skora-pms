import type { Metadata } from "next";
import { Building2, MapPin, Phone } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getClinics } from "@/lib/queries/super-admin";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui/dashboard-ui";
import { formatINR, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Manage Clinics · Super Admin" };

export default async function ClinicsPage() {
  await requireRole(["super_admin", "admin"]);
  const clinics = await getClinics();

  return (
    <div>
      <PageHeader
        title="Manage clinics"
        subtitle={`${clinics.length} clinic location${clinics.length === 1 ? "" : "s"} across your network`}
      />

      {clinics.length === 0 ? (
        <EmptyState icon={Building2} title="No clinics yet" description="Clinics created by doctors appear here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {clinics.map((c) => (
            <div key={c.id} className="card card-hover overflow-hidden">
              <div className="h-20 bg-gradient-to-r from-brand-800 to-accent-700 p-4">
                <div className="flex items-start justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <StatusBadge status={c.isActive ? "active" : "inactive"} />
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-display text-base font-bold text-slate-900">{c.clinicName}</h3>
                <p className="mt-1 text-sm text-slate-500">Owned by {c.doctorName}</p>
                <div className="mt-4 space-y-2 text-sm text-slate-500">
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-700" />
                    {c.address}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 flex-shrink-0 text-brand-700" /> {c.phone}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                  <span className="font-semibold text-brand-800">{formatINR(c.consultationFee)} / visit</span>
                  <span>Since {formatDate(c.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
