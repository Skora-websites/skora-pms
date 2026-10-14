import type { Metadata } from "next";
import { CalendarDays, Stethoscope, Users, Wallet, IndianRupee, TrendingDown, Percent, Clock3 } from "lucide-react";
import {
  getFirstBusinessName,
  getOwnerDashboard,
  listScopedClinicSummaries,
} from "@/lib/queries/admin";
import { requireAdminTier } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { getRates, getArAging, getDoctorPerformance, getCohorts } from "@/lib/queries/analytics";
import { PageHeader, StatCard, StatusBadge, EmptyState } from "@/components/ui/dashboard-ui";
import { ClinicOsDashboard } from "@/app/admin/clinic-os";
import { formatDate, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview · Business" };

const todayStr = () => new Date().toISOString().slice(0, 10);
const monthStartStr = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

export default async function AdminOverviewPage() {
  const { viewerRole } = await requireAdminTier();
  const scope = await getBusinessScope();

  // Clinic managers get the full "Clinic OS" practice-intelligence dashboard
  // (ported from the old doctor home); business owners keep the business
  // overview (per-clinic revenue comparison, team/patient KPIs).
  if (viewerRole === "manager") {
    const businessName = await getFirstBusinessName(scope.businessIds);
    return (
      <ClinicOsDashboard
        doctorIds={scope.doctorIds}
        clinicIds={scope.clinicIds}
        businessName={businessName ?? "Clinic"}
        clinicCount={scope.clinicIds.length}
      />
    );
  }

  const businessName = await getFirstBusinessName(scope.businessIds);
  const doctorIds = scope.doctorIds;
  const clinicIds = scope.clinicIds;

  const today = todayStr();
  const monthStart = monthStartStr();

  // ── Cross-clinic KPIs (all scoped by getBusinessScope) ────────────────
  const kpis = await getOwnerDashboard({
    doctorIds,
    clinicIds,
    today,
    monthStart,
  });

  const {
    todayAppointments: todayAppts,
    monthRevenue: monthBills,
    activeStaff,
    totalPatients,
    recentAppointments,
    revenueByDoctor,
    memberships,
  } = kpis;

  // ── Per-clinic comparison (owners with multiple clinics) ─────────────
  // Doctor-level MTD revenue is mapped onto the clinic each doctor works at.
  const clinicRows = await listScopedClinicSummaries(clinicIds);

  const revenueByDoctorId = new Map(revenueByDoctor.map((r) => [r.doctorId, Number(r.total ?? 0)]));
  const revenueByClinicId = new Map<number, number>();
  for (const m of memberships) {
    const doctorRevenue = revenueByDoctorId.get(m.doctorId) ?? 0;
    revenueByClinicId.set(m.clinicId, (revenueByClinicId.get(m.clinicId) ?? 0) + doctorRevenue);
  }

  const isOwner = viewerRole === "owner";

  // ── Market-standard rates layer (30-day window, scope-aligned) ──────────
  // Owner sees the full scorecard; managers get the same headline rates on
  // their Clinic OS board via clinic-os.tsx.
  const [rates, arAging, cohorts, doctorPerformance] = isOwner
    ? await Promise.all([
        getRates(scope),
        getArAging(doctorIds),
        getCohorts(scope),
        getDoctorPerformance(scope),
      ])
    : [null, [], { newPatients: 0, returningPatients: 0, since: "" }, []] as const;

  const rateCards = isOwner
    ? [
        {
          icon: IndianRupee,
          tone: "accent" as const,
          label: "Collection rate",
          value: rates?.collectionRatePct == null ? "—" : `${rates.collectionRatePct}%`,
          hint: `Received vs billed · ${rates?.windowDays ?? 30}d`,
        },
        {
          icon: TrendingDown,
          tone: "rose" as const,
          label: "No-show rate",
          value: rates?.noShowPct == null ? "—" : `${rates.noShowPct}%`,
          hint: "Cancelled vs decided",
        },
        {
          icon: Percent,
          tone: "amber" as const,
          label: "Slot utilisation",
          value: rates?.utilisationPct == null ? "—" : `${rates.utilisationPct}%`,
          hint: "Today's bookings vs capacity",
        },
        {
          icon: Clock3,
          tone: "brand" as const,
          label: "New vs returning",
          value: `${cohorts.newPatients} / ${cohorts.returningPatients}`,
          hint: `Patients · ${rates?.windowDays ?? 30}d window`,
        },
      ]
    : [];

  const stats = [
    {
      icon: CalendarDays,
      tone: "brand" as const,
      label: "Appointments today",
      value: String(todayAppts),
      hint: isOwner ? "Across your business" : "At your clinic",
    },
    {
      icon: Wallet,
      tone: "accent" as const,
      label: "Revenue this month",
      value: formatINR(monthBills),
      hint: "Received payments",
    },
    {
      icon: Stethoscope,
      tone: "amber" as const,
      label: "Team members",
      value: String(activeStaff),
      hint: "Doctors at your clinics",
    },
    {
      icon: Users,
      tone: "rose" as const,
      label: "Patients",
      value: String(totalPatients),
      hint: "Owned by your doctors",
    },
  ];

  return (
    <div>
      <PageHeader
        title={isOwner ? "Business overview" : "Clinic overview"}
        subtitle={
          businessName
            ? `${businessName} · ${clinicIds.length} clinic${clinicIds.length === 1 ? "" : "s"}`
            : "Business overview"
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} icon={s.icon} tone={s.tone} label={s.label} value={s.value} hint={s.hint} />
        ))}
      </div>

      {isOwner && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {rateCards.map((s) => (
            <StatCard key={s.label} icon={s.icon} tone={s.tone} label={s.label} value={s.value} hint={s.hint} />
          ))}
        </div>
      )}

      {isOwner && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {/* AR aging — who owes what, how old */}
          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">
                Outstanding by age
              </h2>
            </div>
            {arAging.every((b) => b.amount === 0) ? (
              <p className="px-6 py-8 text-center text-sm text-slate-400">No pending amounts. 🎉</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {arAging.map((b) => (
                  <div key={b.label} className="flex items-center justify-between px-6 py-3">
                    <span className="text-sm font-semibold text-ink">{b.label} days</span>
                    <span className="text-right">
                      <span className="block text-sm font-bold text-brand-800">{formatINR(b.amount)}</span>
                      <span className="text-xs text-slate-400">{b.count} bill{b.count === 1 ? "" : "s"}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Doctor performance scorecard */}
          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">
                Doctor performance · 30 days
              </h2>
            </div>
            {doctorPerformance.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-slate-400">
                No doctor activity in the window yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-xs font-medium text-slate-500">
                      <th className="px-6 py-2.5">Doctor</th>
                      <th className="px-3 py-2.5 text-right">Revenue MTD</th>
                      <th className="px-3 py-2.5 text-right">Completed</th>
                      <th className="px-3 py-2.5 text-right">No-show</th>
                      <th className="px-6 py-2.5 text-right">Collection</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {doctorPerformance.map((d) => (
                      <tr key={d.doctorId} className="hover:bg-slate-50/50">
                        <td className="px-6 py-3">
                          <p className="font-semibold text-ink">{d.doctorName}</p>
                          <p className="truncate text-xs text-slate-400">
                            {d.clinicNames.join(", ") || "—"}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-right font-semibold tabular-nums text-brand-800">
                          {formatINR(d.revenueMtd)}
                        </td>
                        <td className="px-3 py-3 text-right tabular-nums">{d.appointmentsCompleted}</td>
                        <td className="px-3 py-3 text-right tabular-nums">
                          {d.noShowPct == null ? "—" : `${d.noShowPct}%`}
                        </td>
                        <td className="px-6 py-3 text-right tabular-nums">
                          {d.collectionRatePct == null ? "—" : `${d.collectionRatePct}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {isOwner && clinicRows.length > 1 && (
        <div className="mt-4 card overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">
              Clinics · revenue this month
            </h2>
          </div>
          <div className="divide-y divide-slate-50">
            {clinicRows.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-6 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{c.clinicName}</p>
                  <p className="text-xs text-slate-400">{c.address}</p>
                </div>
                <span className="text-sm font-bold text-brand-800">
                  {formatINR(revenueByClinicId.get(c.id) ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent & upcoming appointments */}
      <div className="mt-4 card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">
            Upcoming appointments
          </h2>
          <span className="text-xs text-slate-400">Next 6 across the business</span>
        </div>
        {recentAppointments.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No upcoming appointments"
            description="New bookings across your clinics will appear here."
          />
        ) : (
          <div className="divide-y divide-slate-50">
            {recentAppointments.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 px-6 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {a.patientName} · {formatDate(a.date)} {a.time}
                  </p>
                  <p className="text-xs text-slate-400">
                    {a.clinicName ?? "—"} · {a.caseType.replace(/_/g, " ")}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
