import { cache } from "react";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments, consultations, consultationMedications, users, billings } from "@/lib/db/schema";

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
          gte(appointments.date, new Date().toISOString().slice(0, 10)),
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
