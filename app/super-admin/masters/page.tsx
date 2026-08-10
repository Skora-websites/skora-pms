import type { Metadata } from "next";
import { ClipboardList, Stethoscope, Pill, FlaskConical, Activity, HeartPulse } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getMasterCounts } from "@/lib/queries/super-admin";
import { PageHeader } from "@/components/ui/dashboard-ui";

export const metadata: Metadata = { title: "Consult Masters · Super Admin" };

export default async function MastersPage() {
  await requireRole(["super_admin", "admin"]);
  const counts = await getMasterCounts();

  const items = [
    { icon: Activity, label: "Symptoms", count: counts.symptoms, hint: "Common patient symptoms" },
    { icon: Stethoscope, label: "Examinations", count: counts.examinations, hint: "Clinical examination types" },
    { icon: HeartPulse, label: "Diagnoses", count: counts.diagnoses, hint: "Diagnosis vocabulary" },
    { icon: FlaskConical, label: "Lab tests", count: counts.labTests, hint: "Lab test catalogue" },
    { icon: Pill, label: "Medicines", count: counts.medicines, hint: "Medicine catalogue" },
    { icon: ClipboardList, label: "Landing sections", count: counts.landingSections, hint: "CMS-driven marketing content" },
  ];

  return (
    <div>
      <PageHeader
        title="Consult masters"
        subtitle="Reference data used across consultations and prescriptions"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="card card-hover p-6">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-800">
                <item.icon className="h-6 w-6" />
              </span>
              <div>
                <p className="font-display text-2xl font-extrabold text-slate-900">{item.count}</p>
                <p className="text-sm font-semibold text-slate-700">{item.label}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">{item.hint}</p>
          </div>
        ))}
      </div>

      <p className="mt-6 rounded-2xl border border-brand-100 bg-brand-50/50 px-5 py-4 text-sm text-brand-900">
        💡 In the legacy app these records are managed via CRUD pages per master. The same data is
        available to the consultation form through the read APIs in <code className="font-mono text-xs">lib/queries</code>.
      </p>
    </div>
  );
}
