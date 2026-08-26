import type { Metadata } from "next";
import Link from "next/link";
import {
  UserCog,
  Users,
  Building2,
  Newspaper,
  Headset,
  UserPlus,
  ArrowUpRight,
  ClipboardList,
  PanelsTopLeft,
} from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import {
  getSuperAdminStats,
  getDoctors,
  getDoctorGrowth,
  getPatientGrowth,
  getTopClinics,
  getRecentTickets,
} from "@/lib/queries/super-admin";
import { StatCard, PageHeader, StatusBadge } from "@/components/ui/dashboard-ui";
import { MiniBarChart } from "@/components/dashboard/mini-bar-chart";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard · Super Admin" };

export default async function SuperAdminDashboardPage() {
  await requireRole(["super_admin", "admin"]);
  const [stats, doctors, doctorGrowth, patientGrowth, topClinics, recentTickets] =
    await Promise.all([
      getSuperAdminStats(),
      getDoctors(),
      getDoctorGrowth(6),
      getPatientGrowth(6),
      getTopClinics(5),
      getRecentTickets(5),
    ]);

  return (
    <div>
      <PageHeader
        title={`Platform overview`}
        subtitle="Monitor your healthcare network at a glance"
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={UserCog} tone="brand" label="Doctors" value={stats.doctors} hint="Registered practices" />
        <StatCard icon={Users} tone="accent" label="Patients" value={stats.patients} hint="Across all clinics" />
        <StatCard icon={Building2} tone="amber" label="Clinics" value={stats.clinics} hint="Managed locations" />
        <StatCard icon={Headset} tone="rose" label="Open tickets" value={stats.openTickets} hint="Support queue" />
      </div>

      {/* Growth charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-display text-base font-bold text-slate-900">Doctor registrations · 6 months</h2>
          <div className="mt-4">
            <MiniBarChart points={doctorGrowth} tone="brand" />
          </div>
        </div>
        <div className="card p-6">
          <h2 className="font-display text-base font-bold text-slate-900">Patient registrations · 6 months</h2>
          <div className="mt-4">
            <MiniBarChart points={patientGrowth} tone="accent" />
          </div>
        </div>
      </div>

      {/* Top clinics + recent tickets */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="font-display text-base font-bold text-slate-900">Top clinics by revenue</h2>
          </div>
          {topClinics.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-slate-400">No billing data yet.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {topClinics.map((c) => (
                <div key={c.clinicId} className="flex items-center justify-between px-6 py-3.5">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{c.clinicName}</p>
                    <p className="text-xs text-slate-400">{c.doctorName} · {c.count} bills</p>
                  </div>
                  <span className="text-sm font-bold text-brand-800">{formatINR(c.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="font-display text-base font-bold text-slate-900">Recent support tickets</h2>
            <Link href="/super-admin/support" className="text-xs font-semibold text-brand-800 hover:underline">
              View all
            </Link>
          </div>
          {recentTickets.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-slate-400">No tickets yet.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentTickets.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 px-6 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">#{t.id} · {t.subject}</p>
                    <p className="text-xs text-slate-400">{t.userName} · {formatDate(t.createdAt)}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        {/* Recent doctors */}
        <div className="min-w-0">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-slate-900">Recent doctor registrations</h2>
            <Link href="/super-admin/doctors" className="group inline-flex items-center gap-1 text-xs font-semibold text-brand-800 hover:text-brand-600">
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Qualification</th>
                  <th>Joined</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {doctors.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-slate-400">No doctors registered yet.</td></tr>
                )}
                {doctors.slice(0, 8).map((d) => (
                  <tr key={d.id}>
                    <td>
                      <p className="font-semibold text-slate-900">{d.name}</p>
                      <p className="text-xs text-slate-400">{d.email}</p>
                    </td>
                    <td className="text-slate-500">{d.qualification ?? "—"}</td>
                    <td>{formatDate(d.createdAt)}</td>
                    <td><StatusBadge status={d.status ?? "active"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick links */}
        <div className="space-y-3">
          <h2 className="font-display text-base font-bold text-slate-900">Quick actions</h2>
          {[
            { icon: UserPlus, label: "Register a doctor", href: "/super-admin/users" },
            { icon: Building2, label: "Add a clinic", href: "/super-admin/clinics" },
            { icon: ClipboardList, label: "Update masters data", href: "/super-admin/masters" },
            { icon: Newspaper, label: "Write a blog post", href: "/super-admin/blogs" },
            { icon: PanelsTopLeft, label: "Edit landing page", href: "/super-admin/landing" },
          ].map((q) => (
            <Link
              key={q.href}
              href={q.href}
              className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-soft"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                <q.icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-slate-900">{q.label}</span>
              <ArrowUpRight className="ml-auto h-4 w-4 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-brand-700" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
