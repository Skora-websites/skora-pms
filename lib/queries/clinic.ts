import { cache } from "react";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { clinicDoctors, doctorClinics, doctorSchedules, users } from "@/lib/db/schema";

/**
 * Multi-doctor clinic helpers.
 *
 * A "practice" is anchored on the owner doctor (the account a receptionist is
 * attached to via users.doctor_id). Its clinics are the ones the owner owns
 * plus the ones the owner is a member of; its doctors are every active
 * member of those clinics.
 */

/** Clinic ids owned by or (actively) joined by the given doctor. */
export const getClinicsOfDoctor = cache(async (doctorId: number): Promise<number[]> => {
  const owned = await db
    .select({ id: doctorClinics.id })
    .from(doctorClinics)
    .where(eq(doctorClinics.doctorId, doctorId));
  const joined = await db
    .select({ clinicId: clinicDoctors.clinicId })
    .from(clinicDoctors)
    .where(and(eq(clinicDoctors.doctorId, doctorId), eq(clinicDoctors.isActive, true)));
  return [...new Set([...owned.map((c) => c.id), ...joined.map((j) => j.clinicId)])];
});

/** Distinct doctor ids practicing at any of the doctor's clinics (incl. self). */
export const getPracticeDoctorIds = cache(async (doctorId: number): Promise<number[]> => {
  const clinicIds = await getClinicsOfDoctor(doctorId);
  if (clinicIds.length === 0) return [doctorId];
  const rows = await db
    .select({ doctorId: clinicDoctors.doctorId })
    .from(clinicDoctors)
    .where(and(inArray(clinicDoctors.clinicId, clinicIds), eq(clinicDoctors.isActive, true)));
  return [...new Set([...rows.map((r) => r.doctorId), doctorId])];
});

/** Doctor profiles visible in a practice's booking dropdown. */
export type PracticeDoctor = {
  id: number;
  name: string;
  salutation: string | null;
  qualification: string | null;
};

export const getPracticeDoctors = cache(async (doctorId: number): Promise<PracticeDoctor[]> => {
  const ids = await getPracticeDoctorIds(doctorId);
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      salutation: users.salutation,
      qualification: users.qualification,
    })
    .from(users)
    .where(and(inArray(users.id, ids), eq(users.role, "doctor")))
    .orderBy(asc(users.id));
  // The resolved owner may be a doctor-role user missing from the filtered
  // rows only if their role changed — keep the dropdown strictly doctors.
  return rows;
});

/** Is the target doctor part of the given doctor's practice? */
export const isPracticeDoctor = cache(
  async (ownerDoctorId: number, targetDoctorId: number): Promise<boolean> => {
    if (ownerDoctorId === targetDoctorId) return true;
    const ids = await getPracticeDoctorIds(ownerDoctorId);
    return ids.includes(targetDoctorId);
  }
);

/** Active members of one clinic (owner included via backfill/create-time row). */
export const getClinicDoctors = cache(async (clinicId: number) => {
  return db
    .select({
      id: users.id,
      name: users.name,
      salutation: users.salutation,
      qualification: users.qualification,
      specialization: users.specialization,
      registrationNumber: users.registrationNumber,
      phone: users.phone,
      email: users.email,
      profilePhotoPath: users.profilePhotoPath,
    })
    .from(clinicDoctors)
    .innerJoin(users, eq(users.id, clinicDoctors.doctorId))
    .where(and(eq(clinicDoctors.clinicId, clinicId), eq(clinicDoctors.isActive, true)))
    .orderBy(asc(clinicDoctors.id));
});

/** A doctor's weekly OPD slots at one clinic (for their profile card). */
export const getClinicSchedulesOfDoctor = cache(
  async (clinicId: number, doctorId: number) => {
    return db
      .select({
        id: doctorSchedules.id,
        dayOfWeek: doctorSchedules.dayOfWeek,
        startTime: doctorSchedules.startTime,
        endTime: doctorSchedules.endTime,
        sessionType: doctorSchedules.sessionType,
        is24Hours: doctorSchedules.is24Hours,
      })
      .from(doctorSchedules)
      .where(
        and(
          eq(doctorSchedules.doctorClinicId, clinicId),
          eq(doctorSchedules.doctorId, doctorId),
          eq(doctorSchedules.isActive, true)
        )
      )
      .orderBy(asc(doctorSchedules.id));
  }
);

/** Clinics the doctor owns or is a member of, with their active schedules. */
export const getClinicsWithMembership = cache(async (doctorId: number) => {
  const clinicIds = await getClinicsOfDoctor(doctorId);
  if (clinicIds.length === 0) return [];
  return db
    .select()
    .from(doctorClinics)
    .where(inArray(doctorClinics.id, clinicIds))
    .orderBy(asc(doctorClinics.id));
});

/** Ensure the doctor can act on the clinic (owner or active member). */
export async function ensureClinicAccess(clinicId: number, doctorId: number): Promise<boolean> {
  const [owned] = await db
    .select({ id: doctorClinics.id })
    .from(doctorClinics)
    .where(and(eq(doctorClinics.id, clinicId), eq(doctorClinics.doctorId, doctorId)));
  if (owned) return true;
  const [member] = await db
    .select({ id: clinicDoctors.id })
    .from(clinicDoctors)
    .where(
      and(
        eq(clinicDoctors.clinicId, clinicId),
        eq(clinicDoctors.doctorId, doctorId),
        eq(clinicDoctors.isActive, true)
      )
    );
  return !!member;
}

/** Ensure the doctor owns the clinic (membership management is owner-only). */
export async function ensureClinicOwner(clinicId: number, doctorId: number): Promise<boolean> {
  const [owned] = await db
    .select({ id: doctorClinics.id })
    .from(doctorClinics)
    .where(and(eq(doctorClinics.id, clinicId), eq(doctorClinics.doctorId, doctorId)));
  return !!owned;
}
