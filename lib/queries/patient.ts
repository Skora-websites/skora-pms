import { cache } from "react";
import { and, asc, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments, consultations, consultationMedications, users, billings, billingTypes, doctorClinics, doctorSchedules, testBookings, vendors } from "@/lib/db/schema";
import { todayStr } from "@/lib/utils";

/** Patient's bill receipts with doctor + billing type names. */
export const getPatientBills = cache(async (patientId: number) => {
  const rows = await db
    .select({
      id: billings.id,
      billNumber: billings.billNumber,
      totalAmount: billings.totalAmount,
      receivedAmount: billings.receivedAmount,
      pendingAmount: billings.pendingAmount,
      paymentMethod: billings.paymentMethod,
      status: billings.status,
      billDate: billings.billDate,
      notes: billings.notes,
      doctorName: users.name,
      billingTypeName: billingTypes.name,
    })
    .from(billings)
    .innerJoin(users, eq(users.id, billings.doctorId))
    .leftJoin(billingTypes, eq(billingTypes.id, billings.billingTypeId))
    .where(and(eq(billings.patientId, patientId), isNull(billings.deletedAt)))
    .orderBy(desc(billings.billDate));
  return rows;
});

/** All medications for the given consultations, in one grouped query. */
async function medicationsByConsultation(consultationIds: number[]) {
  const map = new Map<number, (typeof consultationMedications.$inferSelect)[]>();
  if (consultationIds.length === 0) return map;
  const meds = await db
    .select()
    .from(consultationMedications)
    .where(inArray(consultationMedications.consultationId, consultationIds))
    .orderBy(consultationMedications.order);
  for (const m of meds) {
    const list = map.get(m.consultationId) ?? [];
    list.push(m);
    map.set(m.consultationId, list);
  }
  return map;
}

/** Patient's prescriptions (consultations) with doctor name. */
export const getPatientPrescriptions = cache(async (patientId: number) => {
  const rows = await db
    .select({
      id: consultations.id,
      consultationDate: consultations.consultationDate,
      diagnosisNote: consultations.diagnosisNote,
      medicationsNote: consultations.medicationsNote,
      symptomsNote: consultations.symptomsNote,
      followUpDate: consultations.followUpDate,
      doctorName: users.name,
      doctorQualification: users.qualification,
    })
    .from(consultations)
    .innerJoin(users, eq(users.id, consultations.doctorId))
    .where(eq(consultations.patientId, patientId))
    .orderBy(desc(consultations.consultationDate));

  const medMap = await medicationsByConsultation(rows.map((c) => c.id));
  return rows.map((c) => ({ ...c, medications: medMap.get(c.id) ?? [] }));
});

/** Patient's test bookings (reports) with vendor name + uploaded file status. */
export const getPatientTestBookings = cache(async (patientId: number) => {
  const rows = await db
    .select({
      id: testBookings.id,
      bookingDate: testBookings.bookingDate,
      tests: testBookings.tests,
      status: testBookings.status,
      uploadedFilePath: testBookings.uploadedFilePath,
      totalAmount: testBookings.totalAmount,
      doctorId: testBookings.doctorId,
      doctorName: users.name,
      vendorName: vendors.name,
    })
    .from(testBookings)
    .innerJoin(users, eq(users.id, testBookings.doctorId))
    .leftJoin(vendors, eq(vendors.id, testBookings.vendorId))
    .where(eq(testBookings.patientId, patientId))
    .orderBy(desc(testBookings.bookingDate));
  return rows;
});

/** Doctor + their primary active clinic (available for self-booking). */
export type AvailableDoctor = {
  id: number;
  name: string;
  qualification: string | null;
  registrationNumber: string | null;
  salutation: string | null;
  profilePhotoPath: string | null;
  city: string | null;
  state: string | null;
  clinicName: string | null;
  clinicAddress: string | null;
  consultationFee: string | null;
};

/** Doctors with at least one active clinic + schedule (available for self-booking). */
export const getAvailableDoctors = cache(async (): Promise<AvailableDoctor[]> => {
  const doctors = await db
    .select({
      id: users.id,
      name: users.name,
      qualification: users.qualification,
      registrationNumber: users.registrationNumber,
      salutation: users.salutation,
      profilePhotoPath: users.profilePhotoPath,
      email: users.email,
      phone: users.phone,
      city: users.city,
      state: users.state,
    })
    .from(users)
    .where(eq(users.role, "doctor"))
    .orderBy(asc(users.name));
  if (doctors.length === 0) return [];

  const doctorIds = doctors.map((d) => d.id);

  // Grouped fetch (avoids N+1): all active clinics for these doctors, then all
  // active schedules for those clinics — two queries total.
  const allClinics = await db
    .select({
      id: doctorClinics.id,
      doctorId: doctorClinics.doctorId,
      clinicName: doctorClinics.clinicName,
      address: doctorClinics.address,
      consultationFee: doctorClinics.consultationFee,
    })
    .from(doctorClinics)
    .where(and(inArray(doctorClinics.doctorId, doctorIds), eq(doctorClinics.isActive, true)))
    .orderBy(asc(doctorClinics.id));

  const clinicsByDoctor = new Map<number, typeof allClinics>();
  for (const c of allClinics) {
    const list = clinicsByDoctor.get(c.doctorId) ?? [];
    list.push(c);
    clinicsByDoctor.set(c.doctorId, list);
  }

  const clinicIds = allClinics.map((c) => c.id);
  // Clinic IDs that have at least one active schedule.
  const scheduledClinicIds = new Set(
    clinicIds.length === 0
      ? []
      : (
          await db
            .selectDistinct({ doctorClinicId: doctorSchedules.doctorClinicId })
            .from(doctorSchedules)
            .where(and(inArray(doctorSchedules.doctorClinicId, clinicIds), eq(doctorSchedules.isActive, true)))
        ).map((r) => r.doctorClinicId)
  );

  const available: AvailableDoctor[] = [];
  for (const d of doctors) {
    // Any active clinic with at least one active schedule makes the doctor
    // bookable. Checking ALL clinics (not just the first) avoids hiding a
    // doctor whose earliest clinic has no schedules but a later one does.
    const clinics = clinicsByDoctor.get(d.id) ?? [];
    const scheduled = clinics.filter((c) => scheduledClinicIds.has(c.id));
    if (scheduled.length === 0) continue;

    // Use the first clinic that actually has a schedule for display.
    const clinic = scheduled[0];
    available.push({
      id: d.id,
      name: d.name,
      qualification: d.qualification,
      registrationNumber: d.registrationNumber,
      salutation: d.salutation,
      profilePhotoPath: d.profilePhotoPath,
      city: d.city,
      state: d.state,
      clinicName: clinic.clinicName,
      clinicAddress: clinic.address,
      consultationFee: clinic.consultationFee,
    });
  }
  return available;
});

/** Parse a legacy "h:mm AM/PM" (or "HH:MM") time string to minutes since midnight. */
function timeToMinutes(t: string): number {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return 0;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const meridiem = m[3]?.toUpperCase();
  if (meridiem) {
    if (meridiem === "PM" && h !== 12) h += 12;
    if (meridiem === "AM" && h === 12) h = 0;
  }
  return h * 60 + min;
}

/** Chronological (appointment date, then time-of-day) ordering for appointment rows. */
function byAppointmentDateTime<
  T extends { date: string; time: string }
>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate !== 0) return byDate;
    return timeToMinutes(a.time) - timeToMinutes(b.time);
  });
}

export const getPatientAppointments = cache(async (patientId: number) => {
  const rows = await db
    .select({
      id: appointments.id,
      date: appointments.date,
      time: appointments.time,
      caseType: appointments.caseType,
      status: appointments.status,
      doctorId: appointments.doctorId,
      doctorName: users.name,
      doctorQualification: users.qualification,
    })
    .from(appointments)
    .innerJoin(users, eq(users.id, appointments.doctorId))
    .where(eq(appointments.patientId, patientId))
    // DB can't sort the legacy "h:mm AM/PM" time strings chronologically,
    // so order by date in SQL and finish the time-of-day sort in JS.
    .orderBy(asc(appointments.date), desc(appointments.createdAt));
  return byAppointmentDateTime(rows);
});

/** Patient's UPCOMING appointments (not cancelled/completed, today or later),
    earliest first — matches the "Upcoming visits" dashboard stat card. */
export const getUpcomingPatientAppointments = cache(async (patientId: number) => {
  const rows = await db
    .select({
      id: appointments.id,
      date: appointments.date,
      time: appointments.time,
      caseType: appointments.caseType,
      status: appointments.status,
      doctorId: appointments.doctorId,
      doctorName: users.name,
      doctorQualification: users.qualification,
    })
    .from(appointments)
    .innerJoin(users, eq(users.id, appointments.doctorId))
    .where(
      and(
        eq(appointments.patientId, patientId),
        gte(appointments.date, todayStr()),
        sql`${appointments.status} NOT IN ('cancelled','completed')`
      )
    )
    .orderBy(asc(appointments.date), desc(appointments.createdAt));
  return byAppointmentDateTime(rows);
});

export const getPatientStats = cache(async (patientId: number) => {
  const [upcoming, completed, total, consultationsCount, billingsData] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(
        and(
          eq(appointments.patientId, patientId),
          gte(appointments.date, todayStr()),
          sql`${appointments.status} NOT IN ('cancelled','completed')`
        )
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(and(eq(appointments.patientId, patientId), eq(appointments.status, "completed"))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(eq(appointments.patientId, patientId)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(consultations)
      .where(eq(consultations.patientId, patientId)),
    db
      .select({ total: sql<string>`coalesce(sum(${billings.totalAmount}), 0)` })
      .from(billings)
      .where(and(eq(billings.patientId, patientId), isNull(billings.deletedAt))),
  ]);

  return {
    upcoming: Number(upcoming[0]?.count ?? 0),
    completed: Number(completed[0]?.count ?? 0),
    total: Number(total[0]?.count ?? 0),
    consultations: Number(consultationsCount[0]?.count ?? 0),
    billed: Number(billingsData[0]?.total ?? 0),
  };
});

export const getPatientConsultations = cache(async (patientId: number) => {
  const rows = await db
    .select({
      id: consultations.id,
      consultationDate: consultations.consultationDate,
      diagnosisNote: consultations.diagnosisNote,
      symptomsNote: consultations.symptomsNote,
      followUpDate: consultations.followUpDate,
      doctorName: users.name,
    })
    .from(consultations)
    .innerJoin(users, eq(users.id, consultations.doctorId))
    .where(eq(consultations.patientId, patientId))
    .orderBy(desc(consultations.consultationDate));

  const medMap = await medicationsByConsultation(rows.map((c) => c.id));
  return rows.map((c) => ({ ...c, medications: medMap.get(c.id) ?? [] }));
});
