import { cache } from "react";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  users,
  doctorClinics,
  billings,
  auditLogs,
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

/** Doctor registrations per month for the last N months. */
export const getDoctorGrowth = cache(async (months = 6) => {
  const rows = await db
    .select({
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, "doctor"));
  const buckets = new Map<string, number>();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    buckets.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
  }
  for (const r of rows) {
    if (!r.createdAt) continue;
    const key = `${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return [...buckets.entries()].map(([label, count]) => ({ label, count }));
});

/** Patient registrations per month for the last N months. */
export const getPatientGrowth = cache(async (months = 6) => {
  const rows = await db
    .select({ createdAt: users.createdAt })
    .from(users)
    .where(eq(users.role, "patient"));
  const buckets = new Map<string, number>();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    buckets.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
  }
  for (const r of rows) {
    if (!r.createdAt) continue;
    const key = `${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return [...buckets.entries()].map(([label, count]) => ({ label, count }));
});

/** Top clinics by total billed amount (non-deleted bills). */
export const getTopClinics = cache(async (limit = 5) => {
  const rows = await db
    .select({
      clinicId: doctorClinics.id,
      clinicName: doctorClinics.clinicName,
      doctorName: users.name,
      total: sql<string>`coalesce(sum(${billings.receivedAmount}), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(billings)
    .innerJoin(users, eq(users.id, billings.doctorId))
    .innerJoin(doctorClinics, eq(doctorClinics.doctorId, billings.doctorId))
    .where(and(eq(billings.deletedAt, sql`NULL`), eq(doctorClinics.isActive, true)))
    .groupBy(doctorClinics.id, doctorClinics.clinicName, users.name)
    .orderBy(desc(sql`sum(${billings.receivedAmount})`))
    .limit(limit);
  return rows.map((r) => ({
    clinicId: r.clinicId,
    clinicName: r.clinicName,
    doctorName: r.doctorName,
    total: Number(r.total ?? 0),
    count: Number(r.count ?? 0),
  }));
});

/** Recent support tickets with user names. */
export const getRecentTickets = cache(async (limit = 5) => {
  const rows = await db
    .select({
      id: supportTickets.id,
      subject: supportTickets.subject,
      status: supportTickets.status,
      createdAt: supportTickets.createdAt,
      userName: users.name,
    })
    .from(supportTickets)
    .innerJoin(users, eq(users.id, supportTickets.userId))
    .where(eq(supportTickets.deletedAt, sql`NULL`))
    .orderBy(desc(supportTickets.createdAt))
    .limit(limit);
  return rows;
});

/** Audit log entries (paginated). */
export const getAuditLogs = cache(
  async (opts: { limit?: number; offset?: number; action?: string } = {}) => {
    const limit = opts.limit ?? 50;
    const offset = opts.offset ?? 0;
    const rows = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        ipAddress: auditLogs.ipAddress,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
        userName: users.name,
      })
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.userId))
      .where(opts.action ? eq(auditLogs.action, opts.action) : undefined)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);
    return rows;
  }
);

/** Distinct audit actions for the filter dropdown. */
export const getAuditActions = cache(async () => {
  const rows = await db
    .select({ action: auditLogs.action })
    .from(auditLogs)
    .groupBy(auditLogs.action)
    .orderBy(asc(auditLogs.action));
  return rows.map((r) => r.action);
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

/** Single doctor + their clinics + recent appointments for the detail page. */
export const getDoctorDetails = cache(async (doctorId: number) => {
  const [doctor] = await db
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
    .where(and(eq(users.id, doctorId), eq(users.role, "doctor")))
    .limit(1);
  if (!doctor) return null;

  const clinics = await db
    .select({
      id: doctorClinics.id,
      clinicName: doctorClinics.clinicName,
      address: doctorClinics.address,
      phone: doctorClinics.phone,
      consultationFee: doctorClinics.consultationFee,
      isActive: doctorClinics.isActive,
    })
    .from(doctorClinics)
    .where(eq(doctorClinics.doctorId, doctorId))
    .orderBy(desc(doctorClinics.isActive));

  return { doctor, clinics };
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

export const getUsers = cache(async (role?: string, search?: string, opts: { limit?: number; offset?: number } = {}) => {
  const like = search ? `%${search}%` : null;
  const where = sql`${users.id} > 0${
    role && role !== "all" ? sql` AND ${users.role} = ${role}` : sql``
  }${
    like ? sql` AND (${users.name} LIKE ${like} OR ${users.email} LIKE ${like} OR ${users.phone} LIKE ${like})` : sql``
  }`;
  const rows = await db
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
    .orderBy(desc(users.createdAt))
    .limit(opts.limit ?? 1000)
    .offset(opts.offset ?? 0);
  return rows;
});

/** Count of users matching a role + search (for pagination). */
export const getUsersCount = cache(async (role?: string, search?: string) => {
  const like = search ? `%${search}%` : null;
  const where = sql`${users.id} > 0${
    role && role !== "all" ? sql` AND ${users.role} = ${role}` : sql``
  }${
    like ? sql` AND (${users.name} LIKE ${like} OR ${users.email} LIKE ${like} OR ${users.phone} LIKE ${like})` : sql``
  }`;
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(where);
  return Number(row?.count ?? 0);
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
      publishAt: blogs.publishAt,
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
