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

  const withMeds = await Promise.all(
    rows.map(async (c) => {
      const meds = await db
        .select()
        .from(consultationMedications)
        .where(eq(consultationMedications.consultationId, c.id))
        .orderBy(consultationMedications.order);
      return { ...c, medications: meds };
    })
  );
  return withMeds;
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

  const available: AvailableDoctor[] = [];
  for (const d of doctors) {
    // Any active clinic with at least one active schedule makes the doctor
    // bookable. Checking ALL clinics (not just the first) avoids hiding a
    // doctor whose earliest clinic has no schedules but a later one does.
    const clinics = await db
      .select({
        id: doctorClinics.id,
        clinicName: doctorClinics.clinicName,
        address: doctorClinics.address,
        consultationFee: doctorClinics.consultationFee,
      })
      .from(doctorClinics)
      .where(and(eq(doctorClinics.doctorId, d.id), eq(doctorClinics.isActive, true)))
      .orderBy(asc(doctorClinics.id));
    if (clinics.length === 0) continue;

    const clinicIds = clinics.map((c) => c.id);
    const scheduleRows = await db
      .select({ id: doctorSchedules.id, doctorClinicId: doctorSchedules.doctorClinicId })
      .from(doctorSchedules)
      .where(
        and(inArray(doctorSchedules.doctorClinicId, clinicIds), eq(doctorSchedules.isActive, true))
      )
      .limit(1);
    if (scheduleRows.length === 0) continue;

    // Use the first clinic that actually has a schedule for display.
    const scheduledClinicId = scheduleRows[0].doctorClinicId;
    const clinic =
      clinics.find((c) => c.id === scheduledClinicId) ??
      clinics.find((c) => c.id === clinics[0].id) ??
      clinics[0];
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

export const getPatientAppointments = cache(async (patientId: number) => {
  return db
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
    .orderBy(desc(appointments.date));
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
      .where(eq(billings.patientId, patientId)),
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

  const withMeds = await Promise.all(
    rows.map(async (c) => {
      const meds = await db
        .select()
        .from(consultationMedications)
        .where(eq(consultationMedications.consultationId, c.id))
        .orderBy(consultationMedications.order);
      return { ...c, medications: meds };
    })
  );

  return withMeds;
});
