import "server-only";

import { cache } from "react";
import { and, eq, gte, inArray, isNull, isNotNull, ne, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  appointments,
  billings,
  clinicDoctors,
  doctorClinics,
  doctorSchedules,
  followUpReminders,
  sessions,
  users,
} from "@/lib/db/schema";

/**
 * Derived analytics for the owner/manager dashboards — the "rates layer" the
 * 2026 PMS market treats as table stakes (collection rate, no-show rate,
 * slot utilisation, AR aging, cohorts, doctor performance). Every metric is
 * computed from existing tables: no schema changes, no counters to maintain,
 * and every query is tenancy-scoped by the caller's business scope.
 *
 * Conventions:
 *  - Money: sum(received/total) on non-deleted bills (matches the overview).
 *  - Appointments: clinic-scoped with a legacy doctor fallback (the same
 *    tenancy rule as app/admin/page.tsx).
 *  - Utilisation: today's completed+confirmed walk of scheduled slots uses
 *    maxPatients as the capacity proxy (scheduled rows with null/0 capacity
 *    are skipped — they cannot produce a denominator).
 */

const RANGE_DAYS = 30;

function windowStart(days = RANGE_DAYS): string {
  const d = new Date();
  d.setDate(d.getDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}

const todayStr = () => new Date().toISOString().slice(0, 10);

const WEEKDAY_ENUM = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
] as const;

export type Rates = {
  collectionRatePct: number | null; // null = no billing activity in the window
  noShowPct: number | null;         // cancelled / total decided appointments
  utilisationPct: number | null;    // today's booked slots vs scheduled capacity
  windowDays: number;
};

/**
 * Headline rates for a scope.
 *  - collectionRate = Σreceived / Σtotal over bills dated in the window.
 *  - noShow = cancelled / decided (decided = completed + cancelled), so a
 *    quiet clinic shows null instead of a misleading 0%.
 *  - utilisation = today's non-cancelled appointments / today's scheduled
 *    slot capacity at the scoped clinics (legacy null-clinic appointments
 *    count toward capacity via the doctor's schedules).
 */
export const getRates = cache(
  async (scope: { doctorIds: number[]; clinicIds: number[] }): Promise<Rates> => {
    const doctorIds = scope.doctorIds.length ? scope.doctorIds : [-1];
    const clinicIds = scope.clinicIds.length ? scope.clinicIds : [-1];
    const since = windowStart();

    const apptTenancy = or(
      and(isNotNull(appointments.clinicId), inArray(appointments.clinicId, clinicIds)),
      and(isNull(appointments.clinicId), inArray(appointments.doctorId, doctorIds))
    );

    const [money] = await db
      .select({
        billed: sql<string>`coalesce(sum(${billings.totalAmount}), 0)`,
        received: sql<string>`coalesce(sum(${billings.receivedAmount}), 0)`,
      })
      .from(billings)
      .where(
        and(
          inArray(billings.doctorId, doctorIds),
          isNull(billings.deletedAt),
          gte(billings.billDate, since)
        )
      );

    const [decided] = await db
      .select({
        completed: sql<number>`sum(case when ${appointments.status} = 'completed' then 1 else 0 end)`,
        cancelled: sql<number>`sum(case when ${appointments.status} = 'cancelled' then 1 else 0 end)`,
      })
      .from(appointments)
      .where(and(apptTenancy, gte(appointments.date, since)));

    const today = todayStr();
    const [booked] = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(and(apptTenancy, eq(appointments.date, today), ne(appointments.status, "cancelled")));

    // Capacity: today's weekday's active schedules at the scoped clinics.
    // today.getDay(): 0=Sunday…6=Saturday → WEEKDAY_ENUM order.
    const weekday = WEEKDAY_ENUM[(new Date().getDay() + 6) % 7];
    const scheduleRows = await db
      .select({ maxPatients: doctorSchedules.maxPatients })
      .from(doctorSchedules)
      .innerJoin(doctorClinics, eq(doctorClinics.id, doctorSchedules.doctorClinicId))
      .where(
        and(
          eq(doctorSchedules.isActive, true),
          inArray(doctorClinics.id, clinicIds),
          or(
            inArray(doctorSchedules.doctorId, doctorIds),
            inArray(doctorClinics.doctorId, doctorIds)
          ),
          sql`${doctorSchedules.dayOfWeek} = ${weekday}`
        )
      );

    const capacity = scheduleRows.reduce(
      (sum, r) => sum + (r.maxPatients && r.maxPatients > 0 ? r.maxPatients : 0),
      0
    );

    const billedNum = Number(money?.billed ?? 0);
    const receivedNum = Number(money?.received ?? 0);
    const completedNum = Number(decided?.completed ?? 0);
    const cancelledNum = Number(decided?.cancelled ?? 0);
    const bookedNum = Number(booked?.count ?? 0);

    return {
      collectionRatePct:
        billedNum > 0 ? Math.round((receivedNum / billedNum) * 100) : null,
      noShowPct:
        completedNum + cancelledNum > 0
          ? Math.round((cancelledNum / (completedNum + cancelledNum)) * 100)
          : null,
      utilisationPct:
        capacity > 0 ? Math.min(999, Math.round((bookedNum / capacity) * 100)) : null,
      windowDays: RANGE_DAYS,
    };
  }
);

export type AgingBucket = { label: string; amount: number; count: number };

/**
 * Accounts receivable aging: pending amounts on non-deleted bills bucketed
 * by bill age (0-30 / 31-60 / 61-90 / 90+ days), scoped to the caller.
 */
export const getArAging = cache(
  async (doctorIds: number[]): Promise<AgingBucket[]> => {
    const ids = doctorIds.length ? doctorIds : [-1];
    const cut = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() - days);
      return d.toISOString().slice(0, 10);
    };

    const rows = await db
      .select({
        bucket: sql<string>`
          case
            when ${billings.billDate} > ${cut(30)} then '0-30'
            when ${billings.billDate} > ${cut(60)} then '31-60'
            when ${billings.billDate} > ${cut(90)} then '61-90'
            else '90+'
          end`,
        amount: sql<string>`coalesce(sum(${billings.pendingAmount}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(billings)
      .where(
        and(
          inArray(billings.doctorId, ids),
          isNull(billings.deletedAt),
          sql`${billings.pendingAmount} > 0`
        )
      )
      .groupBy(sql`1`);

    const order = ["0-30", "31-60", "61-90", "90+"] as const;
    const byKey = new Map(rows.map((r) => [r.bucket, r]));
    return order.map((label) => ({
      label,
      amount: Number(byKey.get(label)?.amount ?? 0),
      count: Number(byKey.get(label)?.count ?? 0),
    }));
  }
);

export type DoctorPerformance = {
  doctorId: number;
  doctorName: string;
  clinicNames: string[];
  revenueMtd: number;
  appointmentsCompleted: number;
  noShowPct: number | null;
  collectionRatePct: number | null;
};

/**
 * Per-doctor scorecard for the owner overview: MTD revenue, completed
 * appointments, no-show and collection rates (window-aligned, 30 days).
 * Only doctors with any activity are returned.
 */
export const getDoctorPerformance = cache(
  async (scope: { doctorIds: number[]; clinicIds: number[] }): Promise<DoctorPerformance[]> => {
    const doctorIds = scope.doctorIds.length ? scope.doctorIds : [-1];
    const clinicIds = scope.clinicIds.length ? scope.clinicIds : [-1];
    const since = windowStart();
    const monthStart = (() => {
      const d = new Date();
      return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
    })();

    const apptTenancy = or(
      and(isNotNull(appointments.clinicId), inArray(appointments.clinicId, clinicIds)),
      and(isNull(appointments.clinicId), inArray(appointments.doctorId, doctorIds))
    );

    const [doctorRows, revenueRows, apptRows, billRateRows, memberships] = await Promise.all([
      db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(and(eq(users.role, "doctor"), inArray(users.id, doctorIds))),

      db
        .select({
          doctorId: billings.doctorId,
          total: sql<string>`coalesce(sum(${billings.receivedAmount}), 0)`,
        })
        .from(billings)
        .where(
          and(
            inArray(billings.doctorId, doctorIds),
            isNull(billings.deletedAt),
            gte(billings.billDate, monthStart)
          )
        )
        .groupBy(billings.doctorId),

      db
        .select({
          doctorId: appointments.doctorId,
          completed: sql<number>`sum(case when ${appointments.status} = 'completed' then 1 else 0 end)`,
          cancelled: sql<number>`sum(case when ${appointments.status} = 'cancelled' then 1 else 0 end)`,
        })
        .from(appointments)
        .where(and(apptTenancy, gte(appointments.date, since)))
        .groupBy(appointments.doctorId),

      db
        .select({
          doctorId: billings.doctorId,
          billed: sql<string>`coalesce(sum(${billings.totalAmount}), 0)`,
          received: sql<string>`coalesce(sum(${billings.receivedAmount}), 0)`,
        })
        .from(billings)
        .where(
          and(
            inArray(billings.doctorId, doctorIds),
            isNull(billings.deletedAt),
            gte(billings.billDate, since)
          )
        )
        .groupBy(billings.doctorId),

      db
        .select({ doctorId: clinicDoctors.doctorId, clinicName: doctorClinics.clinicName })
        .from(clinicDoctors)
        .innerJoin(doctorClinics, eq(doctorClinics.id, clinicDoctors.clinicId))
        .where(inArray(clinicDoctors.clinicId, clinicIds.length ? clinicIds : [-1])),
    ]);

    const revenueMap = new Map(revenueRows.map((r) => [r.doctorId, Number(r.total ?? 0)]));
    const apptMap = new Map(apptRows.map((r) => [r.doctorId, r]));
    const rateMap = new Map(billRateRows.map((r) => [r.doctorId, r]));
    const clinicsByDoctor = new Map<number, string[]>();
    for (const m of memberships) {
      const list = clinicsByDoctor.get(m.doctorId) ?? [];
      if (m.clinicName && !list.includes(m.clinicName)) list.push(m.clinicName);
      clinicsByDoctor.set(m.doctorId, list);
    }

    const performance: DoctorPerformance[] = [];
    for (const doc of doctorRows) {
      const appt = apptMap.get(doc.id);
      const rate = rateMap.get(doc.id);
      const completed = Number(appt?.completed ?? 0);
      const cancelled = Number(appt?.cancelled ?? 0);
      const billed = Number(rate?.billed ?? 0);
      const received = Number(rate?.received ?? 0);
      const revenue = revenueMap.get(doc.id) ?? 0;
      if (completed + cancelled === 0 && billed === 0) continue; // no activity
      performance.push({
        doctorId: doc.id,
        doctorName: doc.name,
        clinicNames: clinicsByDoctor.get(doc.id) ?? [],
        revenueMtd: revenue,
        appointmentsCompleted: completed,
        noShowPct:
          completed + cancelled > 0
            ? Math.round((cancelled / (completed + cancelled)) * 100)
            : null,
        collectionRatePct: billed > 0 ? Math.round((received / billed) * 100) : null,
      });
    }
    return performance.sort((a, b) => b.revenueMtd - a.revenueMtd);
  }
);

export type Cohorts = {
  newPatients: number;
  returningPatients: number;
  since: string;
};

/**
 * New vs returning patients for the window: a patient is "returning" when
 * their earliest scoped appointment predates the window start.
 */
export const getCohorts = cache(
  async (scope: { doctorIds: number[]; clinicIds: number[] }): Promise<Cohorts> => {
    const doctorIds = scope.doctorIds.length ? scope.doctorIds : [-1];
    const clinicIds = scope.clinicIds.length ? scope.clinicIds : [-1];
    const since = windowStart();

    const apptTenancy = or(
      and(isNotNull(appointments.clinicId), inArray(appointments.clinicId, clinicIds)),
      and(isNull(appointments.clinicId), inArray(appointments.doctorId, doctorIds))
    );

    const [row] = await db
      .select({
        newPatients: sql<number>`sum(case when first_visits.first_date >= ${since} then 1 else 0 end)`,
        returningPatients: sql<number>`sum(case when first_visits.first_date < ${since} then 1 else 0 end)`,
      })
      .from(
        // First-ever appointment per patient within the scope.
        db
          .select({
            patientId: appointments.patientId,
            firstDate: sql<string>`min(${appointments.date})`.as("first_date"),
          })
          .from(appointments)
          .where(and(apptTenancy, isNotNull(appointments.patientId)))
          .groupBy(appointments.patientId)
          .as("first_visits")
      );

    return {
      newPatients: Number(row?.newPatients ?? 0),
      returningPatients: Number(row?.returningPatients ?? 0),
      since,
    };
  }
);

export type DormantAccount = {
  userId: number;
  name: string;
  email: string | null;
  role: string;
  status: string;
  lastSeenDays: number | null; // null = never logged in
};

/**
 * Access review (PMS-admin): dashboard accounts with no session activity in
 * `days` (default 90) — including accounts that have never logged in.
 * Sessions carry `last_activity` as a unix-epoch second count (Laravel-style
 * session store).
 */
export const getDormantAccounts = cache(
  async (days = 90): Promise<DormantAccount[]> => {
    const cutoff = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;
    const dashboardRoles = ["doctor", "admin", "manager", "receptionist"] as const;

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        status: users.status,
        lastActivity: sql<number | null>`max(${sessions.lastActivity})`,
      })
      .from(users)
      .leftJoin(sessions, eq(sessions.userId, users.id))
      .where(and(inArray(users.role, [...dashboardRoles]), eq(users.status, "active")))
      .groupBy(users.id, users.name, users.email, users.role, users.status)
      .having(sql`max(${sessions.lastActivity}) is null or max(${sessions.lastActivity}) < ${cutoff}`)
      // MariaDB sorts NULLs first on ASC by default — never-logged-in on top.
      .orderBy(sql`max(${sessions.lastActivity}) asc`)
      .limit(50);

    return rows.map((r) => ({
      userId: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      status: r.status,
      lastSeenDays:
        r.lastActivity == null
          ? null
          : Math.floor((Math.floor(Date.now() / 1000) - Number(r.lastActivity)) / 86400),
    }));
  }
);

// Re-export for callers that want the window constant.
export { windowStart, RANGE_DAYS };

export type DoctorHomeStats = {
  todayCount: number;
  completedWeek: number;
  followUpsDue: number;
  totalPatients: number;
};

/**
 * Doctor-home KPI strip, scoped to the given doctor set (a doctor sees
 * strictly their own numbers per the D4 privacy rule; receptionists pass
 * their whole practice). All counts are simple tallies over existing rows.
 */
export const getDashboardStats = cache(
  async (doctorIds: number[]): Promise<DoctorHomeStats> => {
    const ids = doctorIds.length ? doctorIds : [-1];
    const today = todayStr();
    const weekStart = windowStart(7);

    const [todayRow, weekRow, dueRow, patientsRow] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(appointments)
        .where(
          and(
            inArray(appointments.doctorId, ids),
            eq(appointments.date, today),
            ne(appointments.status, "cancelled")
          )
        ),

      db
        .select({ count: sql<number>`count(*)` })
        .from(appointments)
        .where(
          and(
            inArray(appointments.doctorId, ids),
            eq(appointments.status, "completed"),
            gte(appointments.date, weekStart)
          )
        ),

      db
        .select({ count: sql<number>`count(*)` })
        .from(followUpReminders)
        .where(
          and(
            inArray(followUpReminders.doctorId, ids),
            eq(followUpReminders.status, "pending"),
            sql`${followUpReminders.followUpDate} <= ${today}`
          )
        ),

      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(eq(users.role, "patient"), inArray(users.referenceRoleId, ids))),
    ]);

    return {
      todayCount: Number(todayRow[0]?.count ?? 0),
      completedWeek: Number(weekRow[0]?.count ?? 0),
      followUpsDue: Number(dueRow[0]?.count ?? 0),
      totalPatients: Number(patientsRow[0]?.count ?? 0),
    };
  }
);
