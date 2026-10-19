import "server-only";

import { cache } from "react";
import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, ne, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clinicDoctors,
  appointments,
  businesses,
  billings,
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

export type ScopedClinicNameRow = {
  id: number;
  clinicName: string;
  ownerDoctorId: number;
  isActive: boolean | null;
};

/** Minimal clinic identity (id, name, owning doctor) for roster headers. */
export const listScopedClinicNames = cache(async (clinicIds: number[]): Promise<ScopedClinicNameRow[]> => {
  if (clinicIds.length === 0) return [];
  return db
    .select({
      id: doctorClinics.id,
      clinicName: doctorClinics.clinicName,
      ownerDoctorId: doctorClinics.doctorId,
      isActive: doctorClinics.isActive,
    })
    .from(doctorClinics)
    .where(inArray(doctorClinics.id, clinicIds))
    .orderBy(asc(doctorClinics.id));
});

/** Clinic id/name/address for the owner dashboard's per-clinic comparison. */
export const listScopedClinicSummaries = cache(async (clinicIds: number[]) => {
  if (clinicIds.length === 0) return [];
  return db
    .select({
      id: doctorClinics.id,
      clinicName: doctorClinics.clinicName,
      address: doctorClinics.address,
    })
    .from(doctorClinics)
    .where(inArray(doctorClinics.id, clinicIds));
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

/**
 * Every receptionist with the ownership column needed to filter by scope.
 *
 * The admin staff page needs the reference_role_id anchor so it can tell which
 * clinic a receptionist belongs to, so it cannot use the scoped variant above.
 */
export const listAllReceptionistsWithAnchor = cache(async () => {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      status: users.status,
      referenceRoleId: users.referenceRoleId,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.role, "receptionist"))
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

// ── Staff & roles ───────────────────────────────────────────────────

const USER_MODEL_CONST = "App\\Models\\User";

export type PracticeStaffRow = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: "admin" | "super_admin" | "doctor" | "patient" | "receptionist" | "manager";
  status: string | null;
  createdAt: Date | null;
  referenceRoleId: number | null;
  doctorId: number | null;
};

/**
 * Receptionist accounts linked to a practice by EITHER ownership column.
 *
 * F-06 defence-in-depth: getCurrentUser already falls back between
 * `reference_role_id` and `doctor_id`, so the roster accepts either too —
 * rows provisioned with doctor_id only stay visible even if the two columns
 * drift apart again.
 */
export const listPracticeReceptionists = cache(async (doctorId: number): Promise<PracticeStaffRow[]> => {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
      referenceRoleId: users.referenceRoleId,
      doctorId: users.doctorId,
    })
    .from(users)
    .where(
      and(
        or(eq(users.referenceRoleId, doctorId), eq(users.doctorId, doctorId)),
        eq(users.role, "receptionist")
      )
    )
    .orderBy(asc(users.createdAt));
});

/** Roles belonging to one practice. */
export const listPracticeRoleOptions = cache(async (doctorId: number) => {
  return db
    .select({ id: roles.id, name: roles.name })
    .from(roles)
    .where(eq(roles.doctorId, doctorId))
    .orderBy(asc(roles.id));
});

/** modelId → roleId assignments restricted to the given role ids. */
export const listRoleAssignments = cache(async (roleIds: number[]) => {
  if (roleIds.length === 0) return [];
  return db
    .select({ modelId: modelHasRoles.modelId, roleId: modelHasRoles.roleId })
    .from(modelHasRoles)
    .where(
      and(
        eq(modelHasRoles.modelType, USER_MODEL_CONST),
        inArray(modelHasRoles.roleId, roleIds)
      )
    );
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

/**
 * Manager-role users the CALLER may see in the assignment picker: those
 * assigned to one of the caller's clinics, PLUS managers with no assignment
 * at all. Unassigned managers MUST appear or the assignment form cannot
 * offer them — a newly created manager would otherwise be invisible and
 * permanently un-assignable (found during the 2026-10-20 clean-slate retest).
 *
 * Replaces the unscoped `listManagerUsers`, which returned every manager on
 * the platform and left every future caller of it inheriting that leak
 * (audit M6). Managers assigned to ANOTHER business stay excluded.
 */
export const listManagerUsersInScope = cache(async (clinicIds: number[]) => {
  if (clinicIds.length === 0) return [];

  const [assignedIds, allManagerIds] = await Promise.all([
    db
      .selectDistinct({ userId: clinicManagers.userId })
      .from(clinicManagers)
      .where(and(inArray(clinicManagers.clinicId, clinicIds), eq(clinicManagers.isActive, true))),
    db.selectDistinct({ id: users.id }).from(users).where(eq(users.role, "manager")),
  ]);

  const visible = assignedIds.map((r) => r.userId);
  const allManagers = allManagerIds.map((r) => r.id);
  const unassigned = allManagers.filter((id) => !assignedIds.some((a) => a.userId === id));
  const ids = [...new Set([...visible, ...unassigned])];

  if (ids.length === 0) return [];
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(inArray(users.id, ids))
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

export type RoleWithPermissionCount = {
  id: number;
  name: string;
  doctorId: number | null;
  permissionCount: number;
};

/**
 * A practice's roles with the number of permissions each one grants.
 *
 * The count comes from a LEFT JOIN + GROUP BY rather than a correlated
 * subquery: a role with zero permissions must still appear (an INNER JOIN
 * would silently drop it and the role would vanish from the UI).
 */
export const listRolesWithPermissionCounts = cache(
  async (doctorId: number): Promise<RoleWithPermissionCount[]> => {
    const rows = await db
      .select({
        id: roles.id,
        name: roles.name,
        doctorId: roles.doctorId,
        permissionCount: sql<number>`count(${roleHasPermissions.permissionId})`,
      })
      .from(roles)
      .leftJoin(roleHasPermissions, sql`${roleHasPermissions.roleId} = ${roles.id}`)
      .where(eq(roles.doctorId, doctorId))
      .groupBy(roles.id, roles.name, roles.doctorId)
      .orderBy(asc(roles.id));
    return rows.map((r) => ({ ...r, permissionCount: Number(r.permissionCount ?? 0) }));
  }
);

/** Receptionists anchored to a practice via reference_role_id. */
export const listPracticeReceptionistOptions = cache(async (doctorId: number) => {
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(and(eq(users.referenceRoleId, doctorId), eq(users.role, "receptionist")))
    .orderBy(asc(users.name));
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

/** A single business's name, or undefined when the scope hides every business. */
export const getFirstBusinessName = cache(async (businessIds: number[]): Promise<string | undefined> => {
  if (businessIds.length === 0) return undefined;
  const [row] = await db
    .select({ name: businesses.name })
    .from(businesses)
    .where(inArray(businesses.id, businessIds))
    .limit(1);
  return row?.name;
});

// ── Owner dashboard KPIs ────────────────────────────────────────────

/**
 * The cross-clinic KPI strip and its recent-appointment feed.
 *
 * Tenancy note: appointments are scoped by their OWN clinicId, not the
 * doctor's, because a doctor can work at several clinics — doctor-only
 * scoping would leak another branch's rows into a single-clinic manager's
 * overview. Legacy rows predating clinic assignment (null clinic_id) fall
 * back to doctor scoping. Every query here keeps that rule.
 */
export const getOwnerDashboard = cache(
  async (params: {
    doctorIds: number[];
    clinicIds: number[];
    today: string;
    monthStart: string;
  }) => {
    const { doctorIds, clinicIds, today, monthStart } = params;
    const doctorIdList = scopeOrSentinel(doctorIds);
    const clinicIdList = scopeOrSentinel(clinicIds);

    // An appointment belongs to this scope when its clinic is in scope, or it
    // has no clinic and its doctor is in scope.
    const appointmentInScope = or(
      and(isNotNull(appointments.clinicId), inArray(appointments.clinicId, clinicIdList)),
      and(isNull(appointments.clinicId), inArray(appointments.doctorId, doctorIdList))
    )!;

    const [todayAppointments, monthRevenue, activeStaff, totalPatients, recentAppointments, revenueByDoctor, memberships] =
      await Promise.all([
        db
          .select({ count: sql<number>`count(*)` })
          .from(appointments)
          .where(
            and(
              appointmentInScope,
              eq(appointments.date, today),
              ne(appointments.status, "cancelled")
            )
          ),

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

        clinicIds.length
          ? db
              .select({ count: sql<number>`count(distinct ${clinicDoctors.doctorId})` })
              .from(clinicDoctors)
              .where(inArray(clinicDoctors.clinicId, clinicIdList))
          : Promise.resolve([{ count: 0 }] as { count: number }[]),

        db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(and(eq(users.role, "patient"), inArray(users.referenceRoleId, doctorIdList))),

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
          .where(and(appointmentInScope, gte(appointments.date, today)))
          .orderBy(desc(appointments.date), desc(appointments.time))
          .limit(6),

        // Doctor-level MTD revenue, mapped onto the clinic each doctor works at.
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

    return {
      todayAppointments: Number(todayAppointments[0]?.count ?? 0),
      monthRevenue: Number(monthRevenue[0]?.total ?? 0),
      activeStaff: Number(activeStaff[0]?.count ?? 0),
      totalPatients: Number(totalPatients[0]?.count ?? 0),
      recentAppointments,
      revenueByDoctor,
      memberships,
    };
  }
);
