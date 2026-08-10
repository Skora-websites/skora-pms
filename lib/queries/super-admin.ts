import { cache } from "react";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  users,
  doctorClinics,
  blogs,
  supportTickets,
  symptoms,
  examinations,
  diagnoses,
  labTests,
  medicines,
  landingSections,
} from "@/lib/db/schema";

export const getSuperAdminStats = cache(async () => {
  const [doctors, patients, staff, clinics, blogsCount, openTickets] =
    await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, "doctor")),
      db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.role, "patient")),
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(sql`${users.role} IN ('receptionist','admin')`),
      db.select({ count: sql<number>`count(*)` }).from(doctorClinics),
      db.select({ count: sql<number>`count(*)` }).from(blogs),
      db.select({ count: sql<number>`count(*)` }).from(supportTickets).where(eq(supportTickets.status, "open")),
    ]);

  return {
    doctors: Number(doctors[0]?.count ?? 0),
    patients: Number(patients[0]?.count ?? 0),
    staff: Number(staff[0]?.count ?? 0),
    clinics: Number(clinics[0]?.count ?? 0),
    blogs: Number(blogsCount[0]?.count ?? 0),
    openTickets: Number(openTickets[0]?.count ?? 0),
    monthlyRevenue: 0,
  };
});

export const getDoctors = cache(async (search?: string) => {
  const like = `%${search ?? ""}%`;
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      qualification: users.qualification,
      registrationNumber: users.registrationNumber,
      status: users.status,
      createdAt: users.createdAt,
      trialEndsAt: users.trialEndsAt,
    })
    .from(users)
    .where(
      search
        ? sql`${users.role} = 'doctor' AND (${users.name} LIKE ${like} OR ${users.email} LIKE ${like} OR ${users.phone} LIKE ${like})`
        : eq(users.role, "doctor")
    )
    .orderBy(desc(users.createdAt));
});

export const getClinics = cache(async () => {
  return db
    .select({
      id: doctorClinics.id,
      clinicName: doctorClinics.clinicName,
      address: doctorClinics.address,
      phone: doctorClinics.phone,
      consultationFee: doctorClinics.consultationFee,
      isActive: doctorClinics.isActive,
      createdAt: doctorClinics.createdAt,
      doctorName: users.name,
    })
    .from(doctorClinics)
    .innerJoin(users, eq(users.id, doctorClinics.doctorId))
    .orderBy(desc(doctorClinics.createdAt));
});

export const getUsers = cache(async (role?: string, search?: string) => {
  const like = search ? `%${search}%` : null;
  const where = sql`${users.id} > 0${
    role && role !== "all" ? sql` AND ${users.role} = ${role}` : sql``
  }${
    like ? sql` AND (${users.name} LIKE ${like} OR ${users.email} LIKE ${like} OR ${users.phone} LIKE ${like})` : sql``
  }`;
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      status: users.status,
      doctorId: users.doctorId,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(where)
    .orderBy(desc(users.createdAt));
});

export const getMasterCounts = cache(async () => {
  const [sym, ex, diag, lab, med, sections] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(symptoms),
    db.select({ count: sql<number>`count(*)` }).from(examinations),
    db.select({ count: sql<number>`count(*)` }).from(diagnoses),
    db.select({ count: sql<number>`count(*)` }).from(labTests),
    db.select({ count: sql<number>`count(*)` }).from(medicines),
    db.select({ count: sql<number>`count(*)` }).from(landingSections),
  ]);
  return {
    symptoms: Number(sym[0]?.count ?? 0),
    examinations: Number(ex[0]?.count ?? 0),
    diagnoses: Number(diag[0]?.count ?? 0),
    labTests: Number(lab[0]?.count ?? 0),
    medicines: Number(med[0]?.count ?? 0),
    landingSections: Number(sections[0]?.count ?? 0),
  };
});
