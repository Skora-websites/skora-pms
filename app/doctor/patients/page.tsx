import type { Metadata } from "next";
import Link from "next/link";
import { Users, ArrowUpRight, Plus } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getDoctorPatients } from "@/lib/queries/doctor";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui/dashboard-ui";
import { formatDate, initials } from "@/lib/utils";
import { ExportPatientsButton } from "./export-button";

export const metadata: Metadata = { title: "Registrations · Doctor" };

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; start_date?: string; end_date?: string }>;
}) {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
  const { q, start_date, end_date } = await searchParams;
  const patients = await getDoctorPatients(doctorId, q, start_date, end_date);

  return (
    <div>
      <PageHeader
        title="Patient registrations"
        subtitle={`${patients.length} patient${patients.length === 1 ? "" : "s"} in your care`}
        action={
          <Link href="/doctor/patients/new" className="btn-primary">
            <Plus className="h-4 w-4" /> Register
          </Link>
        }
      />

      <form className="mb-5 flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name, phone or email..."
            className="input"
          />
        </div>
        <div className="w-40">
          <input
            name="start_date"
            type="date"
            defaultValue={start_date ?? ""}
            className="input"
            title="From date"
          />
        </div>
        <div className="w-40">
          <input
            name="end_date"
            type="date"
            defaultValue={end_date ?? ""}
            className="input"
            title="To date"
          />
        </div>
        <button type="submit" className="btn-primary shrink-0">Search</button>
        <ExportPatientsButton />
      </form>

      {patients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No patients found"
          description="Search with a different term, or register a new patient."
          action={{ href: "/doctor/patients/new", label: "Register a patient" }}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {patients.map((p) => (
            <Link
              key={p.id}
              href={`/doctor/patients/${p.id}`}
              className="card card-hover group p-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 to-accent-600 text-sm font-bold text-white">
                  {initials(p.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{p.name}</p>
                  <p className="truncate text-xs text-slate-400">
                    {p.registrationId ?? `#${p.id}`}
                    {p.phone ? ` · ${p.phone}` : p.email ? ` · ${p.email}` : ""}
                  </p>
                </div>
                <ArrowUpRight className="ml-auto h-4 w-4 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-brand-700" />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                <span className="capitalize">
                  {p.gender ?? "—"} · {p.city ?? "—"}
                </span>
                <StatusBadge status={p.status ?? "active"} />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Registered {formatDate(p.createdAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
