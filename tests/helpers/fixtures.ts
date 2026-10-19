/**
 * Fixture factories for the role-scoping suites.
 *
 * Rows are inserted through the app's own `db` singleton so the code under
 * test sees them (see tests/helpers/db.ts for why a separate transaction does
 * not work), and every user carries a `fixture-%` email so
 * `cleanFixtures()` can sweep them.
 *
 * Column sets are the tables' actual NOT NULL columns without defaults —
 * verified against the live schema on 2026-10-19:
 *
 *   users                         name, password
 *   doctor_clinics                doctor_id, clinic_name, address, phone
 *   receptionist_clinics          receptionist_id, clinic_id
 *   appointment_consult_consents  doctor_id, patient_id, slug
 *   appointments                  doctor_id, patient_id, patient_string, date, time
 */

import { db } from "../../lib/db";
import {
  appointments,
  appointmentConsultConsents,
  businesses,
  businessClinics,
  clinicDoctors,
  clinicManagers,
  doctorClinics,
  receptionistClinics,
  users,
} from "../../lib/db/schema";

let seq = 0;
const uid = (label: string) => `${label}-${process.pid}-${++seq}`;

const FIXTURE_EMAIL = (label: string) => `${label}@fixture.test`;

/** A doctor (practice owner) or any staff member; returns the user id. */
export async function makeUser(
  opts: {
    role?: "doctor" | "receptionist" | "manager" | "admin" | "super_admin" | "patient";
    name?: string;
    doctorId?: number | null;
    referenceRoleId?: number | null;
  } = {}
): Promise<number> {
  const role = opts.role ?? "doctor";
  const label = uid(role);
  const [r] = await db
    .insert(users)
    .values({
      name: opts.name ?? `Fixture ${role} ${label}`,
      role,
      password: "x",
      email: FIXTURE_EMAIL(label),
      doctorId: opts.doctorId ?? null,
      referenceRoleId: opts.referenceRoleId ?? null,
      status: "active",
    })
    .$returningId();
  return Number(r.id);
}

/** A clinic owned by `doctorId`; returns the clinic id. */
export async function makeClinic(
  doctorId: number,
  name = `Fixture Clinic ${uid("c")}`
): Promise<number> {
  const [r] = await db
    .insert(doctorClinics)
    .values({ doctorId, clinicName: name, address: "Fixture address", phone: "0000000000" })
    .$returningId();
  return Number(r.id);
}

/** Make `doctorId` an active member of `clinicId` (the shared-clinic case). */
export async function addClinicMember(clinicId: number, doctorId: number): Promise<void> {
  await db.insert(clinicDoctors).values({ clinicId, doctorId, isActive: true });
}

/** Assign `managerId` to `clinicId`; returns void. */
export async function assignManager(
  managerId: number,
  clinicId: number,
  businessId: number
): Promise<void> {
  // `clinic_managers.business_id` is NOT NULL, and the real manager scope
  // joins through `business_clinics`, so the business id must be a real one
  // rather than a doctor id.
  await db.insert(clinicManagers).values({
    userId: managerId,
    clinicId,
    businessId,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as typeof clinicManagers.$inferInsert);
}

/** Assign `receptionistId` to `clinicId` (the G4 assignment table). */
export async function assignReceptionistClinic(
  receptionistId: number,
  clinicId: number
): Promise<void> {
  await db.insert(receptionistClinics).values({ receptionistId, clinicId, isActive: true });
}

/** An appointment anchored to `doctorId` at `clinicId` (may be null). */
export async function makeAppointment(opts: {
  doctorId: number;
  patientId: number;
  clinicId?: number | null;
  date?: string;
  time?: string;
  status?: string;
  caseType?: string;
  note?: string;
}): Promise<number> {
  const [r] = await db
    .insert(appointments)
    .values({
      doctorId: opts.doctorId,
      patientId: opts.patientId,
      patientString: String(opts.patientId),
      clinicId: opts.clinicId ?? null,
      date: opts.date ?? "2026-10-20",
      time: opts.time ?? "10:00",
      status: (opts.status ?? "confirmed") as typeof appointments.$inferInsert["status"],
      caseType: (opts.caseType ??
        "clinical_visit") as typeof appointments.$inferInsert["caseType"],
      note: opts.note ?? null,
    })
    .$returningId();
  return Number(r.id);
}

/** A business owned by `ownerId`; returns the business id. */
export async function makeBusiness(
  ownerId: number,
  name = `Fixture Business ${uid("b")}`
): Promise<number> {
  const [r] = await db
    .insert(businesses)
    .values({ ownerId, name, slug: uid("slug") })
    .$returningId();
  return Number(r.id);
}

/** Link a clinic into a business (the owner→clinic tenancy bridge). */
export async function linkBusinessClinic(businessId: number, clinicId: number): Promise<void> {
  await db.insert(businessClinics).values({ businessId, clinicId, isPrimary: true });
}

/** A patient-owned user attached to `doctorId`; returns the user id. */
export async function makePatient(doctorId: number): Promise<number> {
  return makeUser({ role: "patient", doctorId, referenceRoleId: doctorId });
}

/** An undecided consent row, optionally aged past the retention window. */
export async function makeConsent(opts: {
  doctorId: number;
  patientId: number;
  slug?: string;
  ageDays?: number;
  isAccepted?: boolean;
  isRejected?: boolean;
}): Promise<string> {
  const slug = opts.slug ?? uid("consent");
  await db.insert(appointmentConsultConsents).values({
    slug,
    doctorId: opts.doctorId,
    patientId: opts.patientId,
    status: "pending",
    isAccepted: opts.isAccepted ?? false,
    isRejected: opts.isRejected ?? false,
    createdAt: new Date(Date.now() - (opts.ageDays ?? 0) * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  });
  return slug;
}
