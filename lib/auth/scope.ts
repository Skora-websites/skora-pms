/**
 * Business-scope resolution for the admin/manager dashboard tier.
 *
 * SERVER-ONLY: imports the DB and must never be pulled into a client
 * component (same rule as `lib/auth/server-permissions.ts`).
 *
 * Hierarchy: an `admin` (business owner) owns one-or-more `businesses`; each
 * business groups clinics (`business_clinics` → `doctor_clinics`); `manager`
 * users are assigned to individual clinics (`clinic_managers`).
 *
 * The scope's `doctorIds` is the bridge to the existing query layer: every
 * clinical/financial query in `lib/queries/doctor.ts` accepts a doctor-id
 * list, so owner/manager pages resolve business → clinics → doctor ids once
 * here and reuse the query layer unchanged.
 */

import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  businesses,
  businessClinics,
  clinicDoctors,
  clinicManagers,
  doctorClinics,
  users,
} from "@/lib/db/schema";
import { getCurrentUser } from "./user";

export type BusinessScope = {
  /** How the viewer reaches the data. */
  viewerRole: "owner" | "manager";
  /** Businesses visible to the viewer. */
  businessIds: number[];
  /** Clinics visible to the viewer (within those businesses). */
  clinicIds: number[];
  /**
   * Doctor ids owning/working at those clinics — pass this to the existing
   * doctor-scoped query layer (appointments, billings, transactions, …).
   */
  doctorIds: number[];
};

/**
 * Resolve what the current admin/manager may see. Redirects to /login when
 * unauthenticated and to the viewer's role home when the role isn't part of
 * the admin tier (mirrors `requireRole` semantics).
 *
 * React-cached per request so a page + its actions share one resolution.
 */
export const getBusinessScope = cache(async (): Promise<BusinessScope> => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin" && user.role !== "manager") {
    redirect("/login");
  }

  if (user.role === "admin") {
    return resolveOwnerScope(user.id);
  }
  return resolveManagerScope(user.id);
});

/** Owners see every clinic of every business they own. */
async function resolveOwnerScope(ownerId: number): Promise<BusinessScope> {
  const ownedBusinesses = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.ownerId, ownerId), eq(businesses.isActive, true)));
  const businessIds = ownedBusinesses.map((b) => b.id);
  if (businessIds.length === 0) {
    return { viewerRole: "owner", businessIds: [], clinicIds: [], doctorIds: [] };
  }

  const clinicRows = await db
    .select({ clinicId: businessClinics.clinicId })
    .from(businessClinics)
    .where(inArray(businessClinics.businessId, businessIds));
  const clinicIds = [...new Set(clinicRows.map((r) => r.clinicId))];

  const doctorIds = await doctorIdsForClinics(clinicIds);
  return { viewerRole: "owner", businessIds, clinicIds, doctorIds };
}

/** Managers see only the (active) clinics they're assigned to. */
async function resolveManagerScope(managerId: number): Promise<BusinessScope> {
  const assignmentRows = await db
    .select({ businessId: clinicManagers.businessId, clinicId: clinicManagers.clinicId })
    .from(clinicManagers)
    .where(and(eq(clinicManagers.userId, managerId), eq(clinicManagers.isActive, true)));
  if (assignmentRows.length === 0) {
    return { viewerRole: "manager", businessIds: [], clinicIds: [], doctorIds: [] };
  }

  const businessIds = [...new Set(assignmentRows.map((r) => r.businessId))];
  const clinicIds = [...new Set(assignmentRows.map((r) => r.clinicId))];
  const doctorIds = await doctorIdsForClinics(clinicIds);
  return { viewerRole: "manager", businessIds, clinicIds, doctorIds };
}

/**
 * Doctors whose data belongs to the given clinics: every active member of
 * `clinic_doctors` PLUS the clinic owner (the `doctor_clinics.doctorId` row
 * itself — the owner keeps a member row via migration 0004, but guard
 * against legacy gaps by unioning the owner id).
 */
async function doctorIdsForClinics(clinicIds: number[]): Promise<number[]> {
  if (clinicIds.length === 0) return [];

  const [memberRows, ownerRows] = await Promise.all([
    // Active members of the clinics (the owner holds a member row too via
    // migration 0004, but union the clinic-owner id to cover legacy gaps).
    db
      .select({ doctorId: clinicDoctors.doctorId })
      .from(clinicDoctors)
      .where(and(inArray(clinicDoctors.clinicId, clinicIds), eq(clinicDoctors.isActive, true))),
    db
      .select({ ownerId: doctorClinics.doctorId })
      .from(doctorClinics)
      .where(inArray(doctorClinics.id, clinicIds)),
  ]);

  const ids = new Set<number>();
  for (const r of memberRows) ids.add(r.doctorId);
  for (const r of ownerRows) ids.add(r.ownerId);
  return [...ids];
}

/**
 * Can the current admin-tier viewer act on a specific clinic? Used by
 * server actions to prevent a manager of clinic A writing clinic B.
 */
export async function canAccessClinic(clinicId: number): Promise<boolean> {
  const scope = await getBusinessScope();
  return scope.clinicIds.includes(clinicId);
}

/**
 * Guard for owner-only modules (managers assignment, business settings).
 * Managers are bounced to their home; admins pass through.
 */
export async function requireOwnerViewer(): Promise<Exclude<BusinessScope["viewerRole"], "manager">> {
  const scope = await getBusinessScope();
  if (scope.viewerRole !== "owner") redirect("/admin");
  return "owner";
}

/** Does the named user exist as an admin-tier account (admin or manager)? */
export async function isAdminTierUser(userId: number): Promise<boolean> {
  const [row] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.role === "admin" || row?.role === "manager";
}
