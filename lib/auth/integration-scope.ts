/**
 * Tenant scope for integration (API-token) callers.
 *
 * `/api/shule/doctors` authenticated a bearer token and then queried every
 * active doctor in every tenant, returning email, phone and professional
 * registration number (audit H4). `users` has no `business_id`, so a token
 * holder's tenant is DERIVED from their role:
 *
 *   admin   → the businesses they own (active) → their clinics
 *   manager → the clinics assigned to them (active assignment AND clinic)
 *   doctor  → the clinics they own or actively joined
 *
 * Anything else — patient, receptionist, super_admin, unknown — resolves to no
 * doctors at all rather than to the global table.
 *
 * Kept out of the route module so it can be tested without importing
 * `next/server`, which cannot load under the `--conditions react-server` flag
 * the test harness needs for `@/lib/db`.
 */

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { businessClinics, businesses, clinicManagers, doctorClinics } from "@/lib/db/schema";
import { getDoctorIdsAtClinics, getPracticeDoctorIds } from "@/lib/queries/clinic";
import type { ApiTokenUser } from "./api-token";

export async function resolveVisibleDoctorIds(holder: ApiTokenUser): Promise<number[]> {
  if (holder.role === "admin") {
    const ownedBusinesses = await db
      .selectDistinct({ clinicId: businessClinics.clinicId })
      .from(businesses)
      .innerJoin(businessClinics, eq(businessClinics.businessId, businesses.id))
      .where(and(eq(businesses.ownerId, holder.id), eq(businesses.isActive, true)));
    return getDoctorIdsAtClinics(ownedBusinesses.map((r) => r.clinicId));
  }

  if (holder.role === "manager") {
    // An inactive assignment stops counting, and so does an inactive clinic —
    // mirroring `resolveManagerScope` in lib/auth/scope.ts.
    const assigned = await db
      .selectDistinct({ clinicId: businessClinics.clinicId })
      .from(clinicManagers)
      .innerJoin(doctorClinics, eq(doctorClinics.id, clinicManagers.clinicId))
      .innerJoin(businessClinics, eq(businessClinics.clinicId, clinicManagers.clinicId))
      .where(
        and(
          eq(clinicManagers.userId, holder.id),
          eq(clinicManagers.isActive, true),
          eq(doctorClinics.isActive, true)
        )
      );
    return getDoctorIdsAtClinics(assigned.map((r) => r.clinicId));
  }

  if (holder.role === "doctor") {
    // Owned + joined clinics, and every active member of them, plus self.
    return getPracticeDoctorIds(holder.id);
  }

  return [];
}
