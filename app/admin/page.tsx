import type { Metadata } from "next";
import { CalendarDays, Stethoscope, Users, Wallet } from "lucide-react";
import { and, desc, eq, gte, inArray, isNotNull, isNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  appointments,
  billings,
  businesses,
  clinicDoctors,
  doctorClinics,
  users,
} from "@/lib/db/schema";
import { requireAdminTier } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
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
    const [firstBusiness] = await db
      .select({ name: businesses.name })
      .from(businesses)
      .where(inArray(businesses.id, scope.businessIds.length ? scope.businessIds : [-1]))
      .limit(1);
    return (
      <ClinicOsDashboard
        doctorIds={scope.doctorIds}
        businessName={firstBusiness?.name ?? "Clinic"}
        clinicCount={scope.clinicIds.length}
      />
    );
  }

  const [firstBusiness] = await db
    .select({ name: businesses.name })
    .from(businesses)
    .where(inArray(businesses.id, scope.businessIds.length ? scope.businessIds : [-1]))
    .limit(1);

  const today = todayStr();
  const monthStart = monthStartStr();
  const doctorIds = scope.doctorIds;
  const clinicIds = scope.clinicIds;
  const doctorIdList = doctorIds.length ? doctorIds : [-1];
  const clinicIdList = clinicIds.length ? clinicIds : [-1];

  // ── Cross-clinic KPIs (all scoped by getBusinessScope) ────────────────
  const [todayAppts, monthBills, activeStaff, totalPatients, recentAppointments] =
    await Promise.all([
      // Appointments today at the scoped clinics. Tenancy by the
      // appointment's own clinicId (NOT doctorId): a doctor may work at
      // several clinics, so doctor-only scoping would leak other branches'
      // rows into a single-clinic manager's overview. Legacy rows predating
      // clinic assignment (null clinic_id) fall back to doctor scoping.
      db
        .select({ count: sql<number>`count(*)` })
        .from(appointments)
        .where(
          and(
            or(
              and(
                isNotNull(appointments.clinicId),
                inArray(appointments.clinicId, clinicIdList)
              ),
              and(
                isNull(appointments.clinicId),
                inArray(appointments.doctorId, doctorIdList)
              )
            ),
            eq(appointments.date, today),
            sql`${appointments.status} <> 'cancelled'`
          )
        ),

      // Revenue MTD: received amount on non-deleted bills of scoped doctors
      db
        .select({ total: sql<string>`coalesce(sum(${billings.receivedAmount}), 0)` })
        .from(billings)
        .where(
          and(
            inArray(billings.doctorId, doctorIdList),
            isNull(billings.deletedAt),
            gte(billings.billDate, monthStart)
          )
        ),

      // Active team members across scoped clinics
      db
        .select({ count: sql<number>`count(distinct ${clinicDoctors.doctorId})` })
        .from(clinicDoctors)
        .where(inArray(clinicDoctors.clinicId, clinicIds.length ? clinicIds : [-1])),

      // Patients owned by scoped doctors (reference_role_id semantics)
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(eq(users.role, "patient"), inArray(users.referenceRoleId, doctorIdList))),

      // Upcoming appointments at the scoped clinics — same tenancy rule as
      // the KPI above: clinic-scoped with doctor fallback for legacy rows.
      db
        .select({
          id: appointments.id,
          date: appointments.date,
          time: appointments.time,
          status: appointments.status,
          caseType: appointments.caseType,
          patientName: users.name,
          clinicName: doctorClinics.clinicName,
        })
        .from(appointments)
        .innerJoin(users, eq(users.id, appointments.patientId))
        .leftJoin(doctorClinics, eq(doctorClinics.id, appointments.clinicId))
        .where(
          and(
            or(
              and(
                isNotNull(appointments.clinicId),
                inArray(appointments.clinicId, clinicIdList)
              ),
              and(
                isNull(appointments.clinicId),
                inArray(appointments.doctorId, doctorIdList)
              )
            ),
            gte(appointments.date, today)
          )
        )
        .orderBy(desc(appointments.date), desc(appointments.time))
        .limit(6),
    ]);

  // ── Per-clinic comparison (owners with multiple clinics) ─────────────
  const clinicRows = clinicIds.length
    ? await db
        .select({
          id: doctorClinics.id,
          clinicName: doctorClinics.clinicName,
          address: doctorClinics.address,
        })
        .from(doctorClinics)
        .where(inArray(doctorClinics.id, clinicIds))
    : [];
  // Doctor-level MTD revenue mapped onto the clinic each doctor works at.
  const [revenueByDoctor, memberships] = await Promise.all([
    db
      .select({
        doctorId: billings.doctorId,
        total: sql<string>`coalesce(sum(${billings.receivedAmount}), 0)`,
      })
      .from(billings)
      .where(
        and(
          inArray(billings.doctorId, doctorIdList),
          isNull(billings.deletedAt),
          gte(billings.billDate, monthStart)
        )
      )
      .groupBy(billings.doctorId),
    clinicIds.length
      ? db
          .select({ doctorId: clinicDoctors.doctorId, clinicId: clinicDoctors.clinicId })
          .from(clinicDoctors)
          .where(inArray(clinicDoctors.clinicId, clinicIds))
      : Promise.resolve([] as { doctorId: number; clinicId: number }[]),
  ]);

  const revenueByDoctorId = new Map(revenueByDoctor.map((r) => [r.doctorId, Number(r.total ?? 0)]));
  const revenueByClinicId = new Map<number, number>();
  for (const m of memberships) {
    const doctorRevenue = revenueByDoctorId.get(m.doctorId) ?? 0;
    revenueByClinicId.set(m.clinicId, (revenueByClinicId.get(m.clinicId) ?? 0) + doctorRevenue);
  }

  const isOwner = viewerRole === "owner";

  const stats = [
    {
      icon: CalendarDays,
      tone: "brand" as const,
      label: "Appointments today",
      value: String(Number(todayAppts[0]?.count ?? 0)),
      hint: isOwner ? "Across your business" : "At your clinic",
    },
    {
      icon: Wallet,
      tone: "accent" as const,
      label: "Revenue this month",
      value: formatINR(Number(monthBills[0]?.total ?? 0)),
      hint: "Received payments",
    },
    {
      icon: Stethoscope,
      tone: "amber" as const,
      label: "Team members",
      value: String(Number(activeStaff[0]?.count ?? 0)),
      hint: "Doctors at your clinics",
    },
    {
      icon: Users,
      tone: "rose" as const,
      label: "Patients",
      value: String(Number(totalPatients[0]?.count ?? 0)),
      hint: "Owned by your doctors",
    },
  ];

  return (
    <div>
      <PageHeader
        title={isOwner ? "Business overview" : "Clinic overview"}
        subtitle={
          firstBusiness
            ? `${firstBusiness.name} · ${clinicIds.length} clinic${clinicIds.length === 1 ? "" : "s"}`
            : "Business overview"
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} icon={s.icon} tone={s.tone} label={s.label} value={s.value} hint={s.hint} />
        ))}
      </div>

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
