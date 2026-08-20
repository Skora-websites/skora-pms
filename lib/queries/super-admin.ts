import { cache } from "react";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  users,
  doctorClinics,
  blogs,
  categories,
  supportTickets,
  supportVideos,
  symptoms,
  examinations,
  diagnoses,
  labTests,
  medicines,
  landingSections,
  landingItems,
  type User,
} from "@/lib/db/schema";

export type MasterKind = "symptoms" | "examinations" | "diagnoses" | "lab-tests" | "medicines";

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
      doctorId: doctorClinics.doctorId,
      clinicName: doctorClinics.clinicName,
      address: doctorClinics.address,
      phone: doctorClinics.phone,
      consultationFee: doctorClinics.consultationFee,
      isActive: doctorClinics.isActive,
      clinicLogo: doctorClinics.clinicLogo,
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
      trialEndsAt: users.trialEndsAt,
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

// ── Master data rows (for the admin CRUD panel) ─────────────────────────────

export type MasterRow = {
  id: number;
  name: string;
  strength: string | null;
  form: string | null;
  unit: string | null;
};

export const getMasterData = cache(async (kind: MasterKind): Promise<MasterRow[]> => {
  const rows = await (async () => {
    switch (kind) {
      case "symptoms":
        return db.select().from(symptoms).orderBy(asc(symptoms.name));
      case "examinations":
        return db.select().from(examinations).orderBy(asc(examinations.name));
      case "diagnoses":
        return db.select().from(diagnoses).orderBy(asc(diagnoses.name));
      case "lab-tests":
        return db.select().from(labTests).orderBy(asc(labTests.name));
      case "medicines":
        return db.select().from(medicines).orderBy(asc(medicines.name));
    }
  })();
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    strength: "strength" in r && typeof r.strength === "string" ? r.strength : null,
    form: "form" in r && typeof r.form === "string" ? r.form : null,
    unit: "unit" in r && typeof r.unit === "string" ? r.unit : null,
  }));
});

// ── Categories / Blogs ──────────────────────────────────────────────────────

export const getCategoriesWithCounts = cache(async () => {
  const cats = await db.select().from(categories).orderBy(asc(categories.name));
  const counts = await db
    .select({ categoryId: blogs.categoryId, count: sql<number>`count(*)` })
    .from(blogs)
    .groupBy(blogs.categoryId);
  const map = new Map(counts.map((c) => [c.categoryId, Number(c.count)]));
  return cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug, blogCount: map.get(c.id) ?? 0 }));
});

export const getAllBlogs = cache(async () => {
  return db
    .select({
      id: blogs.id,
      title: blogs.title,
      slug: blogs.slug,
      shortcontent: blogs.shortcontent,
      content: blogs.content,
      image: blogs.image,
      status: blogs.status,
      createdAt: blogs.createdAt,
      categoryId: blogs.categoryId,
      categoryName: categories.name,
    })
    .from(blogs)
    .leftJoin(categories, eq(categories.id, blogs.categoryId))
    .orderBy(desc(blogs.createdAt));
});

// ── Support videos ──────────────────────────────────────────────────────────

export const getSupportVideos = cache(async () => {
  return db.select().from(supportVideos).orderBy(desc(supportVideos.createdAt));
});

// ── Landing CMS (all sections + items, including inactive) ──────────────────

export const getLandingSectionsAdmin = cache(async () => {
  const sections = await db.select().from(landingSections).orderBy(asc(landingSections.id));
  const items = await db
    .select()
    .from(landingItems)
    .orderBy(asc(landingItems.order), asc(landingItems.id));
  const byKey = new Map<string, typeof items>();
  for (const item of items) {
    const list = byKey.get(item.sectionKey) ?? [];
    list.push(item);
    byKey.set(item.sectionKey, list);
  }
  return sections.map((s) => ({ ...s, items: byKey.get(s.key) ?? [] }));
});

// ── Form options ────────────────────────────────────────────────────────────

export const getDoctorOptions = cache(async () => {
  return db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.role, "doctor"))
    .orderBy(asc(users.name));
});

export const getUserForEdit = cache(async (userId: number) => {
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      status: users.status,
      qualification: users.qualification,
      registrationNumber: users.registrationNumber,
      trialEndsAt: users.trialEndsAt,
      referenceRoleId: users.referenceRoleId,
    })
    .from(users)
    .where(eq(users.id, userId));
  return row as Pick<User, "id" | "name" | "email" | "phone" | "role" | "status"> &
    Pick<User, "qualification" | "registrationNumber" | "trialEndsAt" | "referenceRoleId"> | null;
});
