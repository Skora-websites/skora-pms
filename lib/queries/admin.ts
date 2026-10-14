import "server-only";

import { cache } from "react";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clinicDoctors,
  businesses,
  businessClinics,
  clinicManagers,
  companySettings,
  doctorClinics,
  doctorSchedules,
  mailSettings,
  modelHasPermissions,
  modelHasRoles,
  testBookings,
  vendors,
  roleHasPermissions,
  permissions,
  roles,
  users,
} from "@/lib/db/schema";

/**
 * Admin / super-admin read layer.
 *
 * The owner and platform dashboards used to hand-write their queries inside the
 * page bodies, importing `@/lib/db` and the schema directly. That bypassed the
 * `cache()` deduplication every other read path gets from lib/queries, and it
 * left no single place to answer "where does owner-dashboard data come from".
 *
 * Every export is React-cached, so a page and its server actions share one
 * resolution per request. View-shaping (Map grouping, counts per card) stays in
 * the caller — that is presentation, not data access.
 */

// ── Scope helpers ───────────────────────────────────────────────────

/**
 * `inArray` cannot accept an empty list. Rather than branching at every call
 * site, hand it a sentinel that matches nothing.
 */
export function scopeOrSentinel(ids: number[]): number[] {
  return ids.length ? ids : [-1];
}

// ── Clinics ─────────────────────────────────────────────────────────

export type ClinicRow = {
  id: number;
  clinicName: string;
  addressType: "manual" | "map" | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  phone: string | null;
  consultationFee: string | null;
  isActive: boolean | null;
  clinicLogo: string | null;
  doctorId: number;
};

/** Clinics inside a business scope. */
export const listScopedClinics = cache(async (clinicIds: number[]): Promise<ClinicRow[]> => {
  if (clinicIds.length === 0) return [];
  return db
    .select({
      id: doctorClinics.id,
      clinicName: doctorClinics.clinicName,
      addressType: doctorClinics.addressType,
      address: doctorClinics.address,
      latitude: doctorClinics.latitude,
      longitude: doctorClinics.longitude,
      phone: doctorClinics.phone,
      consultationFee: doctorClinics.consultationFee,
      isActive: doctorClinics.isActive,
      clinicLogo: doctorClinics.clinicLogo,
      doctorId: doctorClinics.doctorId,
    })
    .from(doctorClinics)
    .where(inArray(doctorClinics.id, clinicIds))
    .orderBy(asc(doctorClinics.id));
});

/** Distinct doctor count per clinic. */
export const countDoctorsPerClinic = cache(
  async (clinicIds: number[]): Promise<Map<number, number>> => {
    if (clinicIds.length === 0) return new Map();
    const rows = await db
      .select({
        clinicId: clinicDoctors.clinicId,
        count: sql<number>`count(distinct ${clinicDoctors.doctorId})`,
      })
      .from(clinicDoctors)
      .where(inArray(clinicDoctors.clinicId, clinicIds))
      .groupBy(clinicDoctors.clinicId);
    return new Map(rows.map((r) => [r.clinicId, Number(r.count)]));
  }
);

/** Schedule rows per clinic (used for the "N time slots" caption). */
export const countSchedulesPerClinic = cache(
  async (clinicIds: number[]): Promise<Map<number, number>> => {
    if (clinicIds.length === 0) return new Map();
    const rows = await db
      .select({
        clinicId: doctorSchedules.doctorClinicId,
        count: sql<number>`count(*)`,
      })
      .from(doctorSchedules)
      .where(inArray(doctorSchedules.doctorClinicId, clinicIds))
      .groupBy(doctorSchedules.doctorClinicId);
    return new Map(rows.map((r) => [r.clinicId, Number(r.count)]));
  }
);

/** Manager names per clinic, for the "Managers:" line on the clinic cards. */
export const listManagersPerClinic = cache(
  async (clinicIds: number[]): Promise<Map<number, string[]>> => {
    const out = new Map<number, string[]>();
    if (clinicIds.length === 0) return out;
    const rows = await db
      .select({ clinicId: clinicManagers.clinicId, userName: users.name })
      .from(clinicManagers)
      .innerJoin(users, eq(users.id, clinicManagers.userId))
      .where(inArray(clinicManagers.clinicId, clinicIds));
    for (const r of rows) {
      const list = out.get(r.clinicId) ?? [];
      list.push(r.userName);
      out.set(r.clinicId, list);
    }
    return out;
  }
);

/** Doctor memberships per clinic, with each member's profile. */
export const listClinicMembers = cache(async (clinicIds: number[]) => {
  if (clinicIds.length === 0) return [];
  return db
    .select({
      clinicId: clinicDoctors.clinicId,
      doctorId: clinicDoctors.doctorId,
      isActive: clinicDoctors.isActive,
      name: users.name,
      email: users.email,
      phone: users.phone,
      specialization: users.specialization,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(clinicDoctors)
    .innerJoin(users, eq(users.id, clinicDoctors.doctorId))
    .where(and(inArray(clinicDoctors.clinicId, clinicIds), eq(clinicDoctors.isActive, true)))
    .orderBy(asc(clinicDoctors.id));
});

/** Receptionist accounts reachable through the scoped doctors. */
export const listScopedReceptionists = cache(async (doctorIds: number[]) => {
  if (doctorIds.length === 0) return [];
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      status: users.status,
      doctorId: users.doctorId,
    })
    .from(users)
    .where(and(eq(users.role, "receptionist"), inArray(users.doctorId, doctorIds)))
    .orderBy(asc(users.id));
});

export type ScopedPatientRow = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  status: string | null;
  createdAt: Date | null;
};

/**
 * Patients owned by any scoped doctor (the `reference_role_id` ownership
 * semantic), newest first, with an optional name/phone/email search.
 */
export const listScopedPatients = cache(
  async (
    doctorIds: number[],
    search?: string,
    limit = 100
  ): Promise<ScopedPatientRow[]> => {
    if (doctorIds.length === 0) return [];
    const conds = [eq(users.role, "patient"), inArray(users.referenceRoleId, doctorIds)];
    if (search && search.trim()) {
      const like = `%${search.trim()}%`;
      conds.push(
        sql`(${users.name} LIKE ${like} OR ${users.phone} LIKE ${like} OR ${users.email} LIKE ${like})`
      );
    }
    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        gender: users.gender,
        status: users.status,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(...conds))
      .orderBy(desc(users.id))
      .limit(limit);
  }
);

/** Minimal patient options {id, name, phone} for pickers, scoped by doctor. */
export const listPatientOptions = cache(async (doctorIds: number[]) => {
  if (doctorIds.length === 0) return [];
  return db
    .select({ id: users.id, name: users.name, phone: users.phone })
    .from(users)
    .where(and(eq(users.role, "patient"), inArray(users.referenceRoleId, doctorIds)))
    .orderBy(desc(users.createdAt));
});

// ── Schedules ───────────────────────────────────────────────────────

export type ScheduleRow = {
  clinicId: number;
  doctorName: string;
  dayOfWeek: string;
  startTime: string | null;
  endTime: string | null;
  sessionType: string | null;
  isActive: boolean | null;
};

/** Every schedule row across the scoped clinics. */
export const listScopedSchedules = cache(async (clinicIds: number[]): Promise<ScheduleRow[]> => {
  if (clinicIds.length === 0) return [];
  return db
    .select({
      clinicId: doctorSchedules.doctorClinicId,
      doctorName: users.name,
      dayOfWeek: doctorSchedules.dayOfWeek,
      startTime: doctorSchedules.startTime,
      endTime: doctorSchedules.endTime,
      sessionType: doctorSchedules.sessionType,
      isActive: doctorSchedules.isActive,
    })
    .from(doctorSchedules)
    .innerJoin(users, eq(users.id, doctorSchedules.doctorId))
    .where(inArray(doctorSchedules.doctorClinicId, clinicIds))
    .orderBy(asc(doctorSchedules.doctorClinicId), asc(doctorSchedules.id));
});

/** Doctor memberships as {doctorId, clinicId, name} for schedule forms. */
export const listClinicDoctorOptions = cache(async (clinicIds: number[]) => {
  if (clinicIds.length === 0) return [];
  return db
    .select({ doctorId: clinicDoctors.doctorId, clinicId: clinicDoctors.clinicId, name: users.name })
    .from(clinicDoctors)
    .innerJoin(users, eq(users.id, clinicDoctors.doctorId))
    .where(inArray(clinicDoctors.clinicId, clinicIds))
    .orderBy(asc(users.id));
});

// ── Booking ─────────────────────────────────────────────────────────

export type DoctorOptionRow = {
  id: number;
  name: string;
  salutation: string | null;
  qualification: string | null;
};

/** Doctors inside the business scope (booking owner dropdown). */
export const listScopeDoctors = cache(async (doctorIds: number[]): Promise<DoctorOptionRow[]> => {
  if (doctorIds.length === 0) return [];
  return db
    .select({
      id: users.id,
      name: users.name,
      salutation: users.salutation,
      qualification: users.qualification,
    })
    .from(users)
    .where(and(eq(users.role, "doctor"), inArray(users.id, doctorIds)))
    .orderBy(asc(users.id));
});

/**
 * One patient by id, only when they belong to a scoped doctor.
 */
export const getScopedPatient = cache(async (patientId: number, doctorIds: number[]) => {
  if (doctorIds.length === 0) return null;
  const [row] = await db
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
      profilePhotoPath: users.profilePhotoPath,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(
      and(
        eq(users.id, patientId),
        eq(users.role, "patient"),
        inArray(users.referenceRoleId, doctorIds)
      )
    )
    .limit(1);
  return row ?? null;
});

// ── Vendor upload (public token bearer) ─────────────────────────────

export type VendorBookingRow = {
  id: number;
  patientId: number;
  vendorId: number;
  doctorId: number;
  status: string | null;
  uploadedFilePath: string | null;
  tests: unknown;
  uploadLinkToken: string | null;
  updatedAt: Date | null;
};

/**
 * Resolve a vendor upload link to its booking.
 *
 * The upload token IS the credential for this public route (it is an
 * unguessable UUID shared with the lab), so there is no session check here.
 * The caller still enforces the token TTL before rendering anything.
 */
export const getVendorBookingByToken = cache(async (token: string): Promise<VendorBookingRow | null> => {
  const [row] = await db
    .select({
      id: testBookings.id,
      patientId: testBookings.patientId,
      vendorId: testBookings.vendorId,
      doctorId: testBookings.doctorId,
      status: testBookings.status,
      uploadedFilePath: testBookings.uploadedFilePath,
      tests: testBookings.tests,
      uploadLinkToken: testBookings.uploadLinkToken,
      updatedAt: testBookings.updatedAt,
    })
    .from(testBookings)
    .where(eq(testBookings.uploadLinkToken, token))
    .limit(1);
  return row ?? null;
});

/** The parties attached to a vendor booking: patient, lab, ordering doctor. */
export const getVendorBookingParties = cache(
  async (patientId: number, vendorId: number, doctorId: number) => {
    const [patient, vendor, doctor] = await Promise.all([
      db.select({ name: users.name, phone: users.phone }).from(users).where(eq(users.id, patientId)).limit(1),
      db.select({ name: vendors.name }).from(vendors).where(eq(vendors.id, vendorId)).limit(1),
      db.select({ name: users.name }).from(users).where(eq(users.id, doctorId)).limit(1),
    ]);
    return {
      patientName: patient[0]?.name ?? "Patient",
      patientPhone: patient[0]?.phone ?? null,
      vendorName: vendor[0]?.name ?? "Lab",
      doctorName: doctor[0]?.name ?? "Doctor",
    };
  }
);

// ── Manager administration ──────────────────────────────────────────

/** Every manager-role user (candidates for clinic assignment). */
export const listManagerUsers = cache(async () => {
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.role, "manager"))
    .orderBy(asc(users.name));
});

/** Manager → clinic assignments inside a business scope. */
export const listManagerAssignments = cache(async (businessIds: number[]) => {
  if (businessIds.length === 0) return [];
  return db
    .select({
      id: clinicManagers.id,
      clinicId: clinicManagers.clinicId,
      userId: clinicManagers.userId,
      isActive: clinicManagers.isActive,
      createdAt: clinicManagers.createdAt,
      managerName: users.name,
      managerEmail: users.email,
    })
    .from(clinicManagers)
    .innerJoin(users, eq(users.id, clinicManagers.userId))
    .where(inArray(clinicManagers.businessId, businessIds))
    .orderBy(asc(clinicManagers.id));
});

/** Permission names granted directly to each manager user. */
export const listDirectManagerPermissions = cache(async () => {
  return db
    .select({ modelId: modelHasPermissions.modelId, name: permissions.name })
    .from(modelHasPermissions)
    .innerJoin(permissions, eq(permissions.id, modelHasPermissions.permissionId))
    .where(eq(modelHasPermissions.modelType, "App\\Models\\User"));
});

// ── Super-admin platform settings ───────────────────────────────────

/** The single company-settings row (singleton table). */
export const getCompanySettings = cache(async () => {
  const [row] = await db.select().from(companySettings).limit(1);
  return row ?? null;
});

/** The single SMTP-settings row (singleton table). */
export const getMailSettings = cache(async () => {
  const [row] = await db.select().from(mailSettings).limit(1);
  return row ?? null;
});

// ── Roles & permissions (practice roster) ───────────────────────────

/** Roles belonging to one practice, with their member count. */
export const listPracticeRoles = cache(async (doctorId: number) => {
  const rows = await db
    .select({
      id: roles.id,
      name: roles.name,
      doctorId: roles.doctorId,
      userCount: sql<number>`(
        SELECT count(*) FROM ${modelHasRoles}
        WHERE ${modelHasRoles.roleId} = ${roles.id}
      )`,
    })
    .from(roles)
    .where(eq(roles.doctorId, doctorId))
    .orderBy(asc(roles.id));
  return rows.map((r) => ({ ...r, userCount: Number(r.userCount ?? 0) }));
});

/** Users eligible for role assignment inside a practice. */
export const listAssignableStaff = cache(async (doctorId: number) => {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
    })
    .from(users)
    .where(eq(users.doctorId, doctorId))
    .orderBy(asc(users.id));
});

/** Full permission catalogue plus a role's current grants. */
export const getPermissionMatrix = cache(async (roleId: number) => {
  const [all, granted] = await Promise.all([
    db
      .select({ id: permissions.id, name: permissions.name })
      .from(permissions)
      .orderBy(asc(permissions.id)),
    db
      .select({ permissionId: roleHasPermissions.permissionId })
      .from(roleHasPermissions)
      .where(eq(roleHasPermissions.roleId, roleId)),
  ]);
  return { all, grantedIds: new Set(granted.map((g) => g.permissionId)) };
});

/** Permission names per role, scoped to the given role ids. */
export const listPermissionsByRole = cache(async (roleIds: number[]) => {
  const out = new Map<number, string[]>();
  if (roleIds.length === 0) return out;
  const rows = await db
    .select({ roleId: roleHasPermissions.roleId, name: permissions.name })
    .from(roleHasPermissions)
    .innerJoin(permissions, eq(permissions.id, roleHasPermissions.permissionId))
    .where(inArray(roleHasPermissions.roleId, roleIds));
  for (const r of rows) {
    const list = out.get(r.roleId) ?? [];
    list.push(r.name);
    out.set(r.roleId, list);
  }
  return out;
});

// ── Business profiles (owner settings) ──────────────────────────────

export type BusinessProfileRow = {
  id: number;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean | null;
  createdAt: Date | null;
  clinicId: number | null;
  clinicName: string | null;
  isPrimary: boolean | null;
};

/**
 * Scoped businesses joined with their linked clinics. One row per
 * business↔clinic pair — the caller collapses the duplicates, because the
 * clinic grouping is view-shaping rather than data access.
 */
export const listBusinessProfiles = cache(async (businessIds: number[]): Promise<BusinessProfileRow[]> => {
  if (businessIds.length === 0) return [];
  return db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      email: businesses.email,
      phone: businesses.phone,
      address: businesses.address,
      isActive: businesses.isActive,
      createdAt: businesses.createdAt,
      clinicId: businessClinics.clinicId,
      clinicName: doctorClinics.clinicName,
      isPrimary: businessClinics.isPrimary,
    })
    .from(businesses)
    .leftJoin(businessClinics, eq(businessClinics.businessId, businesses.id))
    .leftJoin(doctorClinics, eq(doctorClinics.id, businessClinics.clinicId))
    .where(inArray(businesses.id, businessIds))
    .orderBy(asc(businesses.id));
});

export type BusinessSummaryRow = {
  id: number;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  isActive: boolean | null;
  createdAt: Date | null;
  ownerId: number;
  ownerName: string;
  ownerEmail: string | null;
  ownerStatus: string | null;
  clinicCount: number;
};

/** Every business with its owner and clinic count (super-admin list). */
export const listAllBusinesses = cache(async (): Promise<BusinessSummaryRow[]> => {
  const rows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      email: businesses.email,
      phone: businesses.phone,
      address: businesses.address,
      isActive: businesses.isActive,
      createdAt: businesses.createdAt,
      ownerId: businesses.ownerId,
      ownerName: users.name,
      ownerEmail: users.email,
      ownerStatus: users.status,
      clinicCount: sql<number>`(
        SELECT count(*) FROM ${businessClinics}
        WHERE ${businessClinics.businessId} = ${businesses.id}
      )`,
    })
    .from(businesses)
    .innerJoin(users, eq(users.id, businesses.ownerId))
    .orderBy(asc(businesses.id));
  // MySQL returns count(*) as a string for DECIMAL/INT aggregates.
  return rows.map((r) => ({ ...r, clinicCount: Number(r.clinicCount ?? 0) }));
});
