import { cache } from "react";
import { and, asc, desc, eq, gte, inArray, isNull, lte, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  users,
  appointments,
  clinicDoctors,
  consultations,
  doctorClinics,
  doctorSchedules,
  billings,
  transactions,
  billingTypes,
  incomeTypes,
  expenseTypes,
  testBookings,
  vendors,
  tests,
  supportTickets,
  supportTicketMessages,
  chatRooms,
  messages,
  userChatSettings,
  favorites,
  medicines,
  consultationMedications,
  doctorConsultPdfs,
  followUpReminders,
} from "@/lib/db/schema";
import { todayStr } from "@/lib/utils";

// ── Shared helpers (doctor-id resolution + list pagination) ─────────────────

/**
 * Single source of truth for "whose data am I looking at" (F-07).
 * Receptionists AND admins are practice staff attached to the practice owner
 * via `user.doctorId`; doctors act as themselves.
 */
export function resolvePracticeDoctorId(user: { role: string; id: number; doctorId: number | null }): number {
  return user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
}

/** True for practice-wide viewers (receptionists) — they get the getPractice* query variants. */
export function isPracticeWideUser(role: string): boolean {
  return role === "receptionist";
}

/** Pagination params for dashboard list queries (F-04). */
export type ListPage = { page?: number; pageSize?: number };

const DEFAULT_PAGE_SIZE = 25;

function pageBounds({ page, pageSize = DEFAULT_PAGE_SIZE }: ListPage) {
  const safePage = Math.max(1, page ?? 1);
  return { offset: (safePage - 1) * pageSize, limit: pageSize };
}

export type AppointmentRow = {
  id: number;
  date: string;
  time: string;
  caseType: string;
  status: string;
  consentType: string | null;
  consentFile: string | null;
  patientId: number | null;
  patientName: string;
  patientString: string | null;
  mobileNumber: string | null;
  patientPhone: string | null;
  bloodGroup: string | null;
  bp: string | null;
  weight: string | null;
  height: string | null;
  remarks: string | null;
  note: string | null;
};

async function appointmentRows(where: SQL | undefined, order: SQL | SQL[], limit?: number, offset?: number) {
  const query = db
    .select({
      id: appointments.id,
      date: appointments.date,
      time: appointments.time,
      caseType: appointments.caseType,
      status: appointments.status,
      consentType: appointments.consentType,
      consentFile: appointments.consentFile,
      patientId: appointments.patientId,
      patientString: appointments.patientString,
      mobileNumber: appointments.mobileNumber,
      patientName: users.name,
      patientPhone: users.phone,
      bloodGroup: appointments.bloodGroup,
      bp: appointments.bp,
      weight: appointments.weight,
      height: appointments.height,
      remarks: appointments.remarks,
      note: appointments.note,
    })
    .from(appointments)
    .leftJoin(users, eq(users.id, appointments.patientId))
    .where(where)
    .orderBy(...(Array.isArray(order) ? order : [order]))
    .$dynamic();

  const rows = await (limit != null ? query.limit(limit) : query).offset(offset ?? 0);

  return rows.map((r) => ({
    ...r,
    patientName: r.patientName ?? r.patientString ?? "Walk-in patient",
  }));
}

export const getTodaysAppointments = cache(async (doctorId: number) => {
  const today = todayStr();
  return appointmentRows(
    and(eq(appointments.doctorId, doctorId), eq(appointments.date, today)),
    asc(appointments.time)
  );
});

/** Today's appointments across all practice doctors (receptionist view). */
export const getPracticeTodaysAppointments = cache(async (doctorIds: number[]) => {
  const today = todayStr();
  if (doctorIds.length === 0) return [];
  return appointmentRows(
    and(inArray(appointments.doctorId, doctorIds), eq(appointments.date, today)),
    asc(appointments.time)
  );
});

export const getAppointments = cache(
  async (
    doctorId: number,
    filter: { status?: string; date?: string } = {},
    page: ListPage = {}
  ): Promise<{ rows: AppointmentRow[]; hasMore: boolean }> => {
    const conds = [eq(appointments.doctorId, doctorId)];
    if (filter.status && filter.status !== "all") conds.push(eq(appointments.status, filter.status as never));
    if (filter.date) conds.push(eq(appointments.date, filter.date));
    // Newest bookings first: upcoming dates on top, most recently created
    // booking first within the same date.
    const { offset, limit } = pageBounds(page);
    // Fetch one extra row to detect a next page without a count query.
    const rows = await appointmentRows(and(...conds), [
      desc(appointments.date),
      desc(appointments.createdAt),
      desc(appointments.id),
    ], limit + 1, offset);
    return { rows: rows.slice(0, limit), hasMore: rows.length > limit };
  }
);

/** All practice doctors' appointments (receptionist view). */
export const getPracticeAppointments = cache(
  async (
    doctorIds: number[],
    filter: { status?: string; date?: string } = {},
    page: ListPage = {}
  ): Promise<{ rows: AppointmentRow[]; hasMore: boolean }> => {
    if (doctorIds.length === 0) return { rows: [], hasMore: false };
    const conds = [inArray(appointments.doctorId, doctorIds)];
    if (filter.status && filter.status !== "all") conds.push(eq(appointments.status, filter.status as never));
    if (filter.date) conds.push(eq(appointments.date, filter.date));
    const { offset, limit } = pageBounds(page);
    const rows = await appointmentRows(and(...conds), [
      desc(appointments.date),
      desc(appointments.createdAt),
      desc(appointments.id),
    ], limit + 1, offset);
    return { rows: rows.slice(0, limit), hasMore: rows.length > limit };
  }
);

export const getRecentAppointments = cache(async (doctorId: number, limit = 5) => {
  // "Recent" = most recently BOOKED first (new > old), not by visit date.
  // The limit is pushed into SQL so the dashboard never transfers the whole
  // appointment history just to render 5 cards (F-10).
  return appointmentRows(eq(appointments.doctorId, doctorId), [
    desc(appointments.createdAt),
    desc(appointments.id),
  ], limit);
});

/** Recently booked across all practice doctors (receptionist view). */
export const getPracticeRecentAppointments = cache(async (doctorIds: number[], limit = 5) => {
  if (doctorIds.length === 0) return [];
  return appointmentRows(inArray(appointments.doctorId, doctorIds), [
    desc(appointments.createdAt),
    desc(appointments.id),
  ], limit);
});

export const getOnlineConsultations = cache(
  async (
    doctorId: number,
    filter: { status?: string } = {},
    page: ListPage = {}
  ): Promise<{ rows: AppointmentRow[]; hasMore: boolean }> => {
    const conds = [eq(appointments.doctorId, doctorId), eq(appointments.caseType, "online_visit")];
    if (filter.status && filter.status !== "all") conds.push(eq(appointments.status, filter.status as never));
    const { offset, limit } = pageBounds(page);
    const rows = await appointmentRows(and(...conds), desc(appointments.date), limit + 1, offset);
    return { rows: rows.slice(0, limit), hasMore: rows.length > limit };
  }
);

/** All practice doctors' online visits (receptionist view). */
export const getPracticeOnlineConsultations = cache(
  async (
    doctorIds: number[],
    filter: { status?: string } = {},
    page: ListPage = {}
  ): Promise<{ rows: AppointmentRow[]; hasMore: boolean }> => {
    if (doctorIds.length === 0) return { rows: [], hasMore: false };
    const conds = [inArray(appointments.doctorId, doctorIds), eq(appointments.caseType, "online_visit")];
    if (filter.status && filter.status !== "all") conds.push(eq(appointments.status, filter.status as never));
    const { offset, limit } = pageBounds(page);
    const rows = await appointmentRows(and(...conds), desc(appointments.date), limit + 1, offset);
    return { rows: rows.slice(0, limit), hasMore: rows.length > limit };
  }
);

export const getAppointmentById = cache(async (doctorId: number, id: number) => {
  const [row] = await appointmentRows(
    and(eq(appointments.id, id), eq(appointments.doctorId, doctorId)),
    asc(appointments.id)
  );
  return row ?? null;
});

export const getDoctorPatients = cache(async (doctorId: number, search?: string, startDate?: string, endDate?: string) => {
  const conds = [eq(users.referenceRoleId, doctorId), eq(users.role, "patient")];
  if (search) {
    const like = `%${search}%`;
    conds.push(sql`(${users.name} LIKE ${like} OR ${users.phone} LIKE ${like} OR ${users.email} LIKE ${like})`);
  }
  if (startDate) conds.push(sql`${users.createdAt} >= ${startDate + " 00:00:00"}`);
  if (endDate) conds.push(sql`${users.createdAt} <= ${endDate + " 23:59:59"}`);
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      gender: users.gender,
      dob: users.dob,
      city: users.city,
      state: users.state,
      registrationId: users.registrationId,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(...conds))
    .orderBy(desc(users.createdAt));
});

export const getPatientById = cache(async (doctorId: number, patientId: number) => {
  const [patient] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      gender: users.gender,
      dob: users.dob,
      address: users.address,
      pincode: users.pincode,
      city: users.city,
      state: users.state,
      streetAddress: users.streetAddress,
      salutation: users.salutation,
      aadhaarNo: users.aadhaarNo,
      referredBy: users.referredBy,
      registrationId: users.registrationId,
      profilePhotoPath: users.profilePhotoPath,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(eq(users.id, patientId), eq(users.referenceRoleId, doctorId)));
  if (!patient) return null;

  const [appts, consults] = await Promise.all([
    appointmentRows(and(eq(appointments.doctorId, doctorId), eq(appointments.patientId, patientId)), desc(appointments.date)),
    db
      .select()
      .from(consultations)
      .where(and(eq(consultations.doctorId, doctorId), eq(consultations.patientId, patientId)))
      .orderBy(desc(consultations.consultationDate)),
  ]);

  return { patient, appointments: appts, consultations: consults };
});

export const getPatientPhotoPath = cache(async (patientId: number) => {
  const [row] = await db
    .select({ profilePhotoPath: users.profilePhotoPath })
    .from(users)
    .where(and(eq(users.id, patientId), eq(users.role, "patient")));
  return row?.profilePhotoPath ?? null;
});

export const getClinicsWithSchedules = cache(async (doctorId: number) => {
  // Clinics the doctor owns or is an active member of (shared clinics).
  const clinics = await db
    .select()
    .from(doctorClinics)
    .where(
      or(
        eq(doctorClinics.doctorId, doctorId),
        inArray(
          doctorClinics.id,
          db
            .select({ id: clinicDoctors.clinicId })
            .from(clinicDoctors)
            .where(and(eq(clinicDoctors.doctorId, doctorId), eq(clinicDoctors.isActive, true)))
        )
      )
    );

  if (clinics.length === 0) return [];

  const schedules = await db
    .select()
    .from(doctorSchedules)
    .where(
      and(
        eq(doctorSchedules.doctorId, doctorId),
        eq(doctorSchedules.isActive, true),
        inArray(doctorSchedules.doctorClinicId, clinics.map((c) => c.id))
      )
    )
    .orderBy(asc(doctorSchedules.dayOfWeek));

  return clinics.map((c) => ({
    ...c,
    schedules: schedules.filter((s) => s.doctorClinicId === c.id),
  }));
});

/** Billing overview (bills + types) across one doctor or the whole practice (F-03). */
export const getBillingOverview = cache(async (doctorIds: number[]) => {
  if (doctorIds.length === 0) return { bills: [], billingTypes: [] };
  const [bills, types] = await Promise.all([
    db
      .select({
        id: billings.id,
        billNumber: billings.billNumber,
        patientId: billings.patientId,
        billingTypeId: billings.billingTypeId,
        totalAmount: billings.totalAmount,
        receivedAmount: billings.receivedAmount,
        pendingAmount: billings.pendingAmount,
        paymentMethod: billings.paymentMethod,
        status: billings.status,
        notes: billings.notes,
        billDate: billings.billDate,
        createdAt: billings.createdAt,
        patientName: users.name,
      })
      .from(billings)
      .leftJoin(users, eq(users.id, billings.patientId))
      .where(and(inArray(billings.doctorId, doctorIds), isNull(billings.deletedAt)))
      .orderBy(desc(billings.billDate)),
    db
      .select()
      .from(billingTypes)
      .where(and(inArray(billingTypes.doctorId, doctorIds), eq(billingTypes.isActive, true))),
  ]);
  return { bills, billingTypes: types };
});

/**
 * Active billing types for a doctor (used by consultation-page billing).
 */
export const getBillingTypes = cache(async (doctorId: number) => {
  return db
    .select()
    .from(billingTypes)
    .where(and(eq(billingTypes.doctorId, doctorId), eq(billingTypes.isActive, true)));
});

/**
 * Fetch a single bill (with patient + billing-type + doctor details) scoped
 * by doctor. Used by the print-PDF API route and the bill edit page.
 */
export const getBillById = cache(async (doctorId: number, billId: number) => {
  const [bill] = await db
    .select({
      id: billings.id,
      billNumber: billings.billNumber,
      patientId: billings.patientId,
      billingTypeId: billings.billingTypeId,
      appointmentId: billings.appointmentId,
      consultationId: billings.consultationId,
      totalAmount: billings.totalAmount,
      receivedAmount: billings.receivedAmount,
      pendingAmount: billings.pendingAmount,
      paymentMethod: billings.paymentMethod,
      status: billings.status,
      notes: billings.notes,
      billDate: billings.billDate,
      createdAt: billings.createdAt,
      patientName: users.name,
      patientPhone: users.phone,
      patientEmail: users.email,
      patientRegistrationId: users.registrationId,
      billingTypeName: billingTypes.name,
    })
    .from(billings)
    .leftJoin(users, eq(users.id, billings.patientId))
    .leftJoin(billingTypes, eq(billingTypes.id, billings.billingTypeId))
    .where(and(eq(billings.id, billId), eq(billings.doctorId, doctorId), isNull(billings.deletedAt)));

  if (!bill) return null;

  const [doctor] = await db
    .select({ name: users.name, qualification: users.qualification })
    .from(users)
    .where(eq(users.id, doctorId));

  return {
    ...bill,
    doctorName: doctor?.name ?? "",
    doctorQualification: doctor?.qualification ?? "",
  };
});

/**
 * Unified ledger across one doctor or the whole practice (F-03), paginated
 * (F-04). Totals for the summary cards are computed in SQL over the whole
 * filtered period (not just the visible page). The ledger is keyed by
 * `transactions.userId` (the practice owner's id).
 */
export const getTransactions = cache(
  async (
    doctorIds: number[],
    period: "month" | "last_month" | "all" = "all",
    page: ListPage = {}
  ): Promise<{
    rows: Awaited<ReturnType<typeof transactionRows>>;
    hasMore: boolean;
    incomeTotal: number;
    expenseTotal: number;
    incomeCount: number;
    expenseCount: number;
    incomeTypes: typeof incomeTypes.$inferSelect[];
    expenseTypes: typeof expenseTypes.$inferSelect[];
  }> => {
    if (doctorIds.length === 0)
      return {
        rows: [],
        hasMore: false,
        incomeTotal: 0,
        expenseTotal: 0,
        incomeCount: 0,
        expenseCount: 0,
        incomeTypes: [],
        expenseTypes: [],
      };
    const conds = [inArray(transactions.userId, doctorIds), isNull(transactions.deletedAt)];
    const today = new Date();
    // Local date (server is IST) — toISOString() would mislabel 00:00–05:30.
    const ymd = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (period === "month") {
      const start = ymd(new Date(today.getFullYear(), today.getMonth(), 1));
      conds.push(gte(transactions.date, start));
    } else if (period === "last_month") {
      const start = ymd(new Date(today.getFullYear(), today.getMonth() - 1, 1));
      const end = ymd(new Date(today.getFullYear(), today.getMonth(), 0));
      conds.push(gte(transactions.date, start), lte(transactions.date, end));
    }
    const where = and(...conds);
    const { offset, limit } = pageBounds(page);

    // One extra row to detect a next page without a count query.
    const [rows, totals, types] = await Promise.all([
      transactionRows(where)
        .limit(limit + 1)
        .offset(offset),
      db
        .select({
          incomeTotal: sql<number>`coalesce(sum(case when ${transactions.type} = 1 then ${transactions.amount} else 0 end), 0)`,
          expenseTotal: sql<number>`coalesce(sum(case when ${transactions.type} = 2 then ${transactions.amount} else 0 end), 0)`,
          incomeCount: sql<number>`coalesce(sum(case when ${transactions.type} = 1 then 1 else 0 end), 0)`,
          expenseCount: sql<number>`coalesce(sum(case when ${transactions.type} = 2 then 1 else 0 end), 0)`,
        })
        .from(transactions)
        .where(where),
      Promise.all([
        db
          .select()
          .from(incomeTypes)
          .where(and(inArray(incomeTypes.userId, doctorIds), isNull(incomeTypes.deletedAt)))
          .orderBy(asc(incomeTypes.name)),
        db
          .select()
          .from(expenseTypes)
          .where(and(inArray(expenseTypes.userId, doctorIds), isNull(expenseTypes.deletedAt)))
          .orderBy(asc(expenseTypes.name)),
      ]),
    ]);

    const t = totals[0];
    return {
      rows: rows.slice(0, limit),
      hasMore: rows.length > limit,
      incomeTotal: Number(t?.incomeTotal ?? 0),
      expenseTotal: Number(t?.expenseTotal ?? 0),
      incomeCount: Number(t?.incomeCount ?? 0),
      expenseCount: Number(t?.expenseCount ?? 0),
      incomeTypes: types[0],
      expenseTypes: types[1],
    };
  }
);

function transactionRows(where: SQL | undefined) {
  return db
    .select({
      id: transactions.id,
      type: transactions.type,
      amount: transactions.amount,
      date: transactions.date,
      status: transactions.status,
      description: transactions.description,
      referenceNumber: transactions.referenceNumber,
      paymentMethod: transactions.paymentMethod,
      incomeTypeId: transactions.incomeTypeId,
      expenseTypeId: transactions.expenseTypeId,
      billingId: transactions.billingId,
      filePath: transactions.filePath,
      incomeType: incomeTypes.name,
      expenseType: expenseTypes.name,
    })
    .from(transactions)
    .leftJoin(incomeTypes, eq(incomeTypes.id, transactions.incomeTypeId))
    .leftJoin(expenseTypes, eq(expenseTypes.id, transactions.expenseTypeId))
    .where(where)
    .orderBy(desc(transactions.date), desc(transactions.id));
}

/**
 * Unbounded ledger fetch for the Excel export (F-04: the page is paginated,
 * but exports must still cover the whole period).
 */
export const getAllTransactionsForExport = cache(async (
  doctorIds: number[],
  period: "month" | "last_month" | "all" = "all"
) => {
  if (doctorIds.length === 0)
    return { rows: [], incomeTypes: [], expenseTypes: [] };
  const conds = [inArray(transactions.userId, doctorIds), isNull(transactions.deletedAt)];
  const today = new Date();
  const ymd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  if (period === "month") {
    const start = ymd(new Date(today.getFullYear(), today.getMonth(), 1));
    conds.push(gte(transactions.date, start));
  } else if (period === "last_month") {
    const start = ymd(new Date(today.getFullYear(), today.getMonth() - 1, 1));
    const end = ymd(new Date(today.getFullYear(), today.getMonth(), 0));
    conds.push(gte(transactions.date, start), lte(transactions.date, end));
  }
  const where = and(...conds);
  const [rows, incomeCats, expenseCats] = await Promise.all([
    transactionRows(where),
    db
      .select()
      .from(incomeTypes)
      .where(and(inArray(incomeTypes.userId, doctorIds), isNull(incomeTypes.deletedAt)))
      .orderBy(asc(incomeTypes.name)),
    db
      .select()
      .from(expenseTypes)
      .where(and(inArray(expenseTypes.userId, doctorIds), isNull(expenseTypes.deletedAt)))
      .orderBy(asc(expenseTypes.name)),
  ]);
  return { rows, incomeTypes: incomeCats, expenseTypes: expenseCats };
});

/** Fetch a single transaction scoped to the doctor. */
export const getTransactionById = cache(async (txId: number, doctorId: number) => {
  const [row] = await db
    .select({
      id: transactions.id,
      userId: transactions.userId,
      type: transactions.type,
      incomeTypeId: transactions.incomeTypeId,
      expenseTypeId: transactions.expenseTypeId,
      amount: transactions.amount,
      date: transactions.date,
      status: transactions.status,
      billingId: transactions.billingId,
      referenceNumber: transactions.referenceNumber,
      paymentMethod: transactions.paymentMethod,
      description: transactions.description,
      filePath: transactions.filePath,
      incomeType: incomeTypes.name,
      expenseType: expenseTypes.name,
    })
    .from(transactions)
    .leftJoin(incomeTypes, eq(incomeTypes.id, transactions.incomeTypeId))
    .leftJoin(expenseTypes, eq(expenseTypes.id, transactions.expenseTypeId))
    .where(
      and(
        eq(transactions.id, txId),
        eq(transactions.userId, doctorId),
        isNull(transactions.deletedAt)
      )
    );
  return row ?? null;
});

/**
 * Follow-ups across one doctor or the whole practice (F-03).
 * Receptionists/admins pass getPracticeDoctorIds(); doctors pass [ownId].
 */
export const getFollowUps = cache(async (doctorIds: number[]) => {
  if (doctorIds.length === 0) return [];
  const rows = await db
    .select({
      id: consultations.id,
      followUpDate: consultations.followUpDate,
      followUpStatus: consultations.followUpStatus,
      followUpComment: consultations.followUpComment,
      consultationDate: consultations.consultationDate,
      patientName: users.name,
      patientPhone: users.phone,
    })
    .from(consultations)
    .innerJoin(users, eq(users.id, consultations.patientId))
    .where(
      and(
        inArray(consultations.doctorId, doctorIds),
        isNull(consultations.deletedAt)
      )
    )
    .orderBy(asc(consultations.followUpDate));

  return rows.filter((r) => r.followUpDate);
});

/** Follow-up reminders (call list) across one doctor or the whole practice. */
export const getFollowUpReminders = cache(async (doctorIds: number[]) => {
  if (doctorIds.length === 0) return [];
  return db
    .select({
      id: followUpReminders.id,
      followUpDate: followUpReminders.followUpDate,
      status: followUpReminders.status,
      note: followUpReminders.note,
      createdAt: followUpReminders.createdAt,
      patientId: followUpReminders.patientId,
      patientName: users.name,
      patientPhone: users.phone,
    })
    .from(followUpReminders)
    .innerJoin(users, eq(users.id, followUpReminders.patientId))
    .where(inArray(followUpReminders.doctorId, doctorIds))
    .orderBy(asc(followUpReminders.followUpDate));
});

/**
 * Consultation history across one doctor or the whole practice (F-03),
 * paginated (F-04). One extra row is fetched to detect a next page without
 * a count query.
 */
export const getConsultations = cache(
  async (
    doctorIds: number[],
    page: ListPage = {}
  ): Promise<{ rows: Awaited<ReturnType<typeof consultationsRows>>; hasMore: boolean }> => {
    if (doctorIds.length === 0) return { rows: [], hasMore: false };
    const { offset, limit } = pageBounds(page);
    const rows = await consultationsRows(doctorIds)
      .limit(limit + 1)
      .offset(offset);
    return { rows: rows.slice(0, limit), hasMore: rows.length > limit };
  }
);

function consultationsRows(doctorIds: number[]) {
  return db
    .select({
      id: consultations.id,
      consultationDate: consultations.consultationDate,
      symptomsNote: consultations.symptomsNote,
      diagnosisNote: consultations.diagnosisNote,
      medicationsNote: consultations.medicationsNote,
      followUpDate: consultations.followUpDate,
      followUpStatus: consultations.followUpStatus,
      patientId: consultations.patientId,
      patientName: users.name,
      patientPhone: users.phone,
      patientRegistrationId: users.registrationId,
      appointmentId: consultations.appointmentId,
    })
    .from(consultations)
    .innerJoin(users, eq(users.id, consultations.patientId))
    .where(
      and(
        inArray(consultations.doctorId, doctorIds),
        isNull(consultations.deletedAt)
      )
    )
    .orderBy(desc(consultations.consultationDate), desc(consultations.id));
}

/**
 * Lab bookings across one doctor or the whole practice (F-03), paginated
 * (F-04). One extra row is fetched to detect a next page without a count.
 */
export const getTestBookings = cache(
  async (
    doctorIds: number[],
    filter: { status?: string; q?: string } = {},
    page: ListPage = {}
  ): Promise<{ rows: Awaited<ReturnType<typeof testBookingRows>>; hasMore: boolean }> => {
    if (doctorIds.length === 0) return { rows: [], hasMore: false };
    const { offset, limit } = pageBounds(page);
    const rows = await testBookingRows(doctorIds, filter)
      .limit(limit + 1)
      .offset(offset);
    return { rows: rows.slice(0, limit), hasMore: rows.length > limit };
  }
);

function testBookingRows(doctorIds: number[], filter: { status?: string; q?: string }) {
  const conds = [inArray(testBookings.doctorId, doctorIds)];
  if (filter.status && filter.status !== "all") conds.push(eq(testBookings.status, filter.status as never));
  if (filter.q) {
    const like = `%${filter.q}%`;
    conds.push(sql`(${users.name} LIKE ${like} OR ${users.registrationId} LIKE ${like} OR ${users.phone} LIKE ${like})`);
  }
  return db
    .select({
      id: testBookings.id,
      bookingDate: testBookings.bookingDate,
      bookingTime: testBookings.bookingTime,
      totalAmount: testBookings.totalAmount,
      paymentAmount: testBookings.paymentAmount,
      paymentMethod: testBookings.paymentMethod,
      status: testBookings.status,
      notes: testBookings.notes,
      tests: testBookings.tests,
      uploadLinkToken: testBookings.uploadLinkToken,
      uploadedFilePath: testBookings.uploadedFilePath,
      patientId: testBookings.patientId,
      patientName: users.name,
      patientPhone: users.phone,
      patientRegistrationId: users.registrationId,
      vendorId: testBookings.vendorId,
      vendorName: vendors.name,
      vendorEmail: vendors.email,
    })
    .from(testBookings)
    .innerJoin(users, eq(users.id, testBookings.patientId))
    .leftJoin(vendors, eq(vendors.id, testBookings.vendorId))
    .where(and(...conds))
    .orderBy(desc(testBookings.bookingDate), desc(testBookings.id));
}

/** Active lab vendors across one doctor or the whole practice (F-03). */
export const getVendors = cache(async (doctorIds: number[]) => {
  if (doctorIds.length === 0) return [];
  return db
    .select()
    .from(vendors)
    .where(and(inArray(vendors.doctorId, doctorIds), eq(vendors.status, true)))
    .orderBy(asc(vendors.name));
});

/** Active lab tests across one doctor or the whole practice (F-03). */
export const getTests = cache(async (doctorIds: number[]) => {
  if (doctorIds.length === 0) return [];
  return db
    .select()
    .from(tests)
    .where(and(inArray(tests.doctorId, doctorIds), eq(tests.status, true)))
    .orderBy(asc(tests.name));
});

/**
 * Support tickets with all messages batched into a single query (F-04:
 * was one messages query per ticket via Promise.all).
 */
export const getSupportTickets = cache(async (userId: number) => {
  const tickets = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.userId, userId))
    .orderBy(desc(supportTickets.createdAt));
  if (tickets.length === 0) return [];

  const allMessages = await db
    .select({
      id: supportTicketMessages.id,
      supportTicketId: supportTicketMessages.supportTicketId,
      message: supportTicketMessages.message,
      isAdminReply: supportTicketMessages.isAdminReply,
      createdAt: supportTicketMessages.createdAt,
      senderName: users.name,
    })
    .from(supportTicketMessages)
    .innerJoin(users, eq(users.id, supportTicketMessages.senderId))
    .where(
      inArray(
        supportTicketMessages.supportTicketId,
        tickets.map((t) => t.id)
      )
    )
    .orderBy(asc(supportTicketMessages.createdAt));

  const byTicket = new Map<number, typeof allMessages>();
  for (const m of allMessages) {
    const list = byTicket.get(m.supportTicketId) ?? [];
    list.push(m);
    byTicket.set(m.supportTicketId, list);
  }

  return tickets.map((t) => ({ ...t, messages: byTicket.get(t.id) ?? [] }));
});

// ── Chat ────────────────────────────────────────────────────────────────────

export type ChatMessage = {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  timestamp: Date | null;
  isMine: boolean;
  isFavorite: boolean;
};

export const getChatData = cache(async (userId: number) => {
  const [room] = await db.select().from(chatRooms).where(eq(chatRooms.name, "Doctors Group"));
  const chatRoom = room ?? (await db.insert(chatRooms).values({ name: "Doctors Group", type: "group", createdAt: new Date(), updatedAt: new Date() }).$returningId())[0];
  const roomId = Number(chatRoom.id);

  const [settings] = await db
    .select()
    .from(userChatSettings)
    .where(and(eq(userChatSettings.userId, userId), eq(userChatSettings.chatRoomId, roomId)));

  const [memberCountRow] = await db
    .select({ count: sql<number>`count(distinct ${messages.senderId})` })
    .from(messages)
    .where(eq(messages.chatRoomId, roomId));

  const favRows = await db
    .select({ messageId: favorites.messageId })
    .from(favorites)
    .where(eq(favorites.userId, userId));
  const favSet = new Set(favRows.map((f) => f.messageId));

  const rows = await db
    .select({
      id: messages.id,
      content: messages.content,
      senderId: messages.senderId,
      senderName: users.name,
      timestamp: messages.timestamp,
    })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.senderId))
    .where(
      and(
        eq(messages.chatRoomId, roomId),
        isNull(messages.deletedAt),
        settings?.lastClearedAt
          ? sql`${messages.timestamp} > ${settings.lastClearedAt}`
          : undefined
      )
    )
    .orderBy(asc(messages.timestamp))
    .limit(200);

  return {
    roomId,
    roomName: chatRoom.name,
    memberCount: Number(memberCountRow?.count ?? 0),
    muted: settings?.muted ?? false,
    messages: rows.map((m) => ({
      id: m.id,
      content: m.content,
      senderId: m.senderId,
      senderName: m.senderName ?? "Unknown",
      timestamp: m.timestamp,
      isMine: m.senderId === userId,
      isFavorite: favSet.has(m.id),
    })),
  };
});

export const getChatMessagesSince = cache(async (roomId: number, sinceId: number) => {
  const rows = await db
    .select({
      id: messages.id,
      content: messages.content,
      senderId: messages.senderId,
      senderName: users.name,
      timestamp: messages.timestamp,
    })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.senderId))
    .where(and(eq(messages.chatRoomId, roomId), isNull(messages.deletedAt), sql`${messages.id} > ${sinceId}`))
    .orderBy(asc(messages.timestamp));
  return rows;
});

// ── Home visits ─────────────────────────────────────────────────────────────

/** Home-visit appointments across one doctor or the whole practice (F-03). */
export const getHomeVisits = cache(async (doctorIds: number[]) => {
  if (doctorIds.length === 0) return [];
  const rows = await db
    .select({
      id: appointments.id,
      date: appointments.date,
      time: appointments.time,
      status: appointments.status,
      patientString: appointments.patientString,
      notes: appointments.note,
      patientId: appointments.patientId,
      patientName: users.name,
      patientPhone: users.phone,
      patientCity: users.city,
      patientState: users.state,
    })
    .from(appointments)
    .leftJoin(users, eq(users.id, appointments.patientId))
    .where(
      and(
        inArray(appointments.doctorId, doctorIds),
        eq(appointments.caseType, "home_visit")
      )
    )
    .orderBy(desc(appointments.date));

  return rows.map((r) => ({
    ...r,
    patientName: r.patientName ?? r.patientString ?? "Walk-in patient",
  }));
});

/** Full patient details + appointment history for the home-visits drawer (legacy `patientDetailshowing`). */
export const getHomeVisitPatientDetail = cache(async (doctorId: number, patientId: number) => {
  const [patient] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      gender: users.gender,
      dob: users.dob,
      address: users.address,
      streetAddress: users.streetAddress,
      city: users.city,
      state: users.state,
      pincode: users.pincode,
      registrationId: users.registrationId,
      referredBy: users.referredBy,
    })
    .from(users)
    .where(and(eq(users.id, patientId), eq(users.referenceRoleId, doctorId), eq(users.role, "patient")));
  if (!patient) return null;

  const apptRows = await db
    .select({
      id: appointments.id,
      date: appointments.date,
      time: appointments.time,
      status: appointments.status,
      caseType: appointments.caseType,
      note: appointments.note,
      doctorName: users.name,
    })
    .from(appointments)
    .innerJoin(users, eq(users.id, appointments.doctorId))
    .where(eq(appointments.patientId, patientId))
    .orderBy(desc(appointments.date));

  return { patient, appointments: apptRows };
});

// ── Shop / medicine inventory ───────────────────────────────────────────────

export const getMedicineInventory = cache(async (search?: string, form?: string) => {
  const conds = [];
  if (search) {
    const like = `%${search}%`;
    conds.push(sql`(${medicines.name} LIKE ${like} OR ${medicines.strength} LIKE ${like} OR ${medicines.form} LIKE ${like})`);
  }
  if (form) conds.push(eq(medicines.form, form));
  const rows = await db
    .select()
    .from(medicines)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(asc(medicines.name));
  return rows;
});

// ── Consultation data for prescription PDF ──────────────────────────────────

export const getConsultationForPdf = cache(async (doctorId: number, consultationId: number) => {
  const [consultation] = await db
    .select({
      id: consultations.id,
      patientId: consultations.patientId,
      doctorId: consultations.doctorId,
      consultationDate: consultations.consultationDate,
      symptomsNote: consultations.symptomsNote,
      examinationNote: consultations.examinationNote,
      diagnosisNote: consultations.diagnosisNote,
      labNote: consultations.labNote,
      medicationsNote: consultations.medicationsNote,
      medicalHistory: consultations.medicalHistory,
      followUpDate: consultations.followUpDate,
      followUpStatus: consultations.followUpStatus,
    })
    .from(consultations)
    .where(and(eq(consultations.id, consultationId), eq(consultations.doctorId, doctorId)));
  if (!consultation) return null;

  const [patient] = await db
    .select({ name: users.name, dob: users.dob, gender: users.gender, phone: users.phone, city: users.city, state: users.state })
    .from(users)
    .where(eq(users.id, consultation.patientId));

  const [doctor] = await db
    .select({ name: users.name, qualification: users.qualification, registrationNumber: users.registrationNumber, phone: users.phone })
    .from(users)
    .where(eq(users.id, doctorId));

  const [clinic] = await db
    .select({ clinicName: doctorClinics.clinicName, address: doctorClinics.address, phone: doctorClinics.phone })
    .from(doctorClinics)
    .where(eq(doctorClinics.doctorId, doctorId));

  const meds = await db
    .select({
      medicineName: consultationMedications.medicineName,
      dose: consultationMedications.dose,
      frequency: consultationMedications.frequency,
      whenToTake: consultationMedications.whenToTake,
      duration: consultationMedications.duration,
      note: consultationMedications.note,
    })
    .from(consultationMedications)
    .where(eq(consultationMedications.consultationId, consultationId))
    .orderBy(asc(consultationMedications.order));

  return { consultation, patient, doctor, clinic, medications: meds };
});

export const getConsultationIdByAppointment = cache(async (doctorId: number, appointmentId: number) => {
  const [row] = await db
    .select({ id: consultations.id })
    .from(consultations)
    .where(and(eq(consultations.appointmentId, appointmentId), eq(consultations.doctorId, doctorId)));
  return row?.id ?? null;
});

export const getDoctorConsultPdf = cache(async (doctorId: number) => {
  const [row] = await db
    .select({ id: doctorConsultPdfs.id, pdfPath: doctorConsultPdfs.pdfPath })
    .from(doctorConsultPdfs)
    .where(eq(doctorConsultPdfs.doctorId, doctorId));
  return row ?? null;
});

export const getDoctorStats = cache(async (doctorId: number) => {
  const today = todayStr();
  const monthStart = todayStr(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const [todayAppts, totalPatients, pendingFollowUps, monthIncome, monthExpense, weekAppts] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(appointments)
        .where(and(eq(appointments.doctorId, doctorId), eq(appointments.date, today))),
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(eq(users.referenceRoleId, doctorId), eq(users.role, "patient"))),
      db
        .select({ count: sql<number>`count(*)` })
        .from(consultations)
        .where(
          and(
            eq(consultations.doctorId, doctorId),
            eq(consultations.followUpStatus, "pending"),
            gte(consultations.followUpDate, today)
          )
        ),
      db
        .select({ total: sql<string>`coalesce(sum(${transactions.amount}), 0)` })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, doctorId),
            eq(transactions.type, 1),
            eq(transactions.status, "approved"),
            isNull(transactions.deletedAt),
            gte(transactions.date, monthStart)
          )
        ),
      db
        .select({ total: sql<string>`coalesce(sum(${transactions.amount}), 0)` })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, doctorId),
            eq(transactions.type, 2),
            eq(transactions.status, "approved"),
            isNull(transactions.deletedAt),
            gte(transactions.date, monthStart)
          )
        ),
      db
        .select({ date: appointments.date, count: sql<number>`count(*)` })
        .from(appointments)
        .where(
          and(
            eq(appointments.doctorId, doctorId),
            gte(appointments.date, todayStr(new Date(Date.now() - 6 * 86400000))),
            // Upper bound = today so the dashboard's 7-day "traffic" chart
            // doesn't silently ingest future-dated bookings.
            lte(appointments.date, today)
          )
        )
        .groupBy(appointments.date),
    ]);

  return {
    todayAppointments: Number(todayAppts[0]?.count ?? 0),
    totalPatients: Number(totalPatients[0]?.count ?? 0),
    pendingFollowUps: Number(pendingFollowUps[0]?.count ?? 0),
    monthIncome: Number(monthIncome[0]?.total ?? 0),
    monthExpense: Number(monthExpense[0]?.total ?? 0),
    weekAppointments: weekAppts.map((w) => ({
      date: w.date,
      count: Number(w.count),
    })),
  };
});

/**
 * Practice-wide stats (manager/owner overview): same KPIs as getDoctorStats
 * but fanned out across the scope's doctor ids. Week/day counts are keyed by
 * `date` so callers can map them onto local-day labels.
 */
export const getPracticeStats = cache(async (doctorIds: number[]) => {
  if (doctorIds.length === 0) {
    return {
      todayAppointments: 0,
      totalPatients: 0,
      pendingFollowUps: 0,
      monthIncome: 0,
      monthExpense: 0,
      weekAppointments: [] as { date: string; count: number }[],
    };
  }
  const today = todayStr();
  const monthStart = todayStr(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const weekStart = todayStr(new Date(Date.now() - 6 * 86400000));

  const [todayAppts, totalPatients, pendingFollowUps, monthIncome, monthExpense, weekAppts] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(appointments)
        .where(and(inArray(appointments.doctorId, doctorIds), eq(appointments.date, today))),
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(eq(users.role, "patient"), inArray(users.referenceRoleId, doctorIds))),
      db
        .select({ count: sql<number>`count(*)` })
        .from(consultations)
        .where(
          and(
            inArray(consultations.doctorId, doctorIds),
            eq(consultations.followUpStatus, "pending"),
            gte(consultations.followUpDate, today)
          )
        ),
      db
        .select({ total: sql<string>`coalesce(sum(${transactions.amount}), 0)` })
        .from(transactions)
        .where(
          and(
            inArray(transactions.userId, doctorIds),
            eq(transactions.type, 1),
            eq(transactions.status, "approved"),
            isNull(transactions.deletedAt),
            gte(transactions.date, monthStart)
          )
        ),
      db
        .select({ total: sql<string>`coalesce(sum(${transactions.amount}), 0)` })
        .from(transactions)
        .where(
          and(
            inArray(transactions.userId, doctorIds),
            eq(transactions.type, 2),
            eq(transactions.status, "approved"),
            isNull(transactions.deletedAt),
            gte(transactions.date, monthStart)
          )
        ),
      db
        .select({ date: appointments.date, count: sql<number>`count(*)` })
        .from(appointments)
        .where(
          and(
            inArray(appointments.doctorId, doctorIds),
            gte(appointments.date, weekStart),
            // Upper bound = today so the 7-day "traffic" chart doesn't
            // silently ingest future-dated bookings.
            lte(appointments.date, today)
          )
        )
        .groupBy(appointments.date),
    ]);

  return {
    todayAppointments: Number(todayAppts[0]?.count ?? 0),
    totalPatients: Number(totalPatients[0]?.count ?? 0),
    pendingFollowUps: Number(pendingFollowUps[0]?.count ?? 0),
    monthIncome: Number(monthIncome[0]?.total ?? 0),
    monthExpense: Number(monthExpense[0]?.total ?? 0),
    weekAppointments: weekAppts.map((w) => ({ date: w.date, count: Number(w.count) })),
  };
});

/**
 * Income & expense totals per month for the last N months across a set of
 * practice/business doctors (manager/owner finance chart).
 */
export const getPracticeFinanceTrend = cache(async (doctorIds: number[], months = 6) => {
  if (doctorIds.length === 0) {
    return Array.from({ length: months }, (_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (months - 1 - i));
      return { label: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, income: 0, expense: 0 };
    });
  }
  const rows = await db
    .select({
      date: transactions.date,
      type: transactions.type,
      amount: transactions.amount,
    })
    .from(transactions)
    .where(
      and(
        inArray(transactions.userId, doctorIds),
        eq(transactions.status, "approved"),
        isNull(transactions.deletedAt)
      )
    );

  const buckets = new Map<string, { income: number; expense: number }>();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, { income: 0, expense: 0 });
  }

  for (const r of rows) {
    const key = r.date.slice(0, 7);
    if (buckets.has(key)) {
      const b = buckets.get(key)!;
      if (r.type === 1) b.income += Number(r.amount);
      else if (r.type === 2) b.expense += Number(r.amount);
    }
  }

  return [...buckets.entries()].map(([label, { income, expense }]) => ({ label, income, expense }));
});

/** Income & expense totals per month for the last N months (dashboard chart). */
export const getDoctorFinanceTrend = cache(async (doctorId: number, months = 6) => {
  const rows = await db
    .select({
      date: transactions.date,
      type: transactions.type,
      amount: transactions.amount,
    })
    .from(transactions)
    .where(and(eq(transactions.userId, doctorId), eq(transactions.status, "approved"), isNull(transactions.deletedAt)));

  const buckets = new Map<string, { income: number; expense: number }>();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, { income: 0, expense: 0 });
  }

  for (const r of rows) {
    const key = r.date.slice(0, 7);
    if (buckets.has(key)) {
      const b = buckets.get(key)!;
      if (r.type === 1) b.income += Number(r.amount);
      else if (r.type === 2) b.expense += Number(r.amount);
    }
  }

  return [...buckets.entries()].map(([label, { income, expense }]) => ({ label, income, expense }));
});
