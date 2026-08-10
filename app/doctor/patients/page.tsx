import type { Metadata } from "next";
import Link from "next/link";
import { Users, ArrowUpRight } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getDoctorPatients } from "@/lib/queries/doctor";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui/dashboard-ui";
import { formatDate, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Registrations · Doctor" };

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
  const { q } = await searchParams;
  const patients = await getDoctorPatients(doctorId, q);

  return (
    <div>
      <PageHeader
        title="Patient registrations"
        subtitle={`${patients.length} patient${patients.length === 1 ? "" : "s"} in your care`}
      />

      <form className="mb-5 flex max-w-md gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name, phone or email…"
          className="input"
        />
        <button type="submit" className="btn-primary shrink-0">Search</button>
      </form>

      {patients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No patients found"
          description="Search with a different term, or register a new patient."
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
                  <p className="truncate text-xs text-slate-400">{p.phone ?? p.email ?? "—"}</p>
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
