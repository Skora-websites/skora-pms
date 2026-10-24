import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, doctorClinics } from "@/lib/db/schema";
import { SOS_TTL_MIN } from "@/lib/config";

// Re-exported from lib/config (client-safe): the doctor panel's offer
// countdown imports it, and importing from this module would drag the
// server-only db into the client bundle.
export { SOS_TTL_MIN };

/**
 * The doctor a dispatch action acts as.
 *
 * Always the acting user's own id. Receptionists are NOT resolved to their
 * linked practice owner (audit H12): doing so let a front-desk account act as
 * the owner on emergency cases and read the patient's PHI. Receptionists are
 * refused by the action's tier guard before this is ever reached.
 */
export function resolveDoctorId(user: { role: string; id: number; doctorId?: number | null }): number {
  return user.id;
}

/** Privacy-first masking until a doctor accepts: show initials only. */
export function maskPatient(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join(".") || "Patient";
}

export type NearbyDoctor = {
  doctorId: number;
  name: string;
  /** Null when the doctor is dispatched on their own GPS, not a clinic. */
  clinicId: number | null;
  clinicName: string;
  distanceKm: number;
};

/** Haversine distance between two lat/lng points in kilometres. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Find active on-duty doctors within `radiusKm` of the patient location.
 *
 * Primary source is the doctor's active clinics (doctor_clinics stores
 * coordinates as varchar). A doctor whose clinics carry no usable coordinates
 * is NOT silently dropped: they fall back to their own `users.latitude` /
 * `users.longitude` and are emitted as a mobile entry (`clinicId: null`).
 */
export async function findNearbyOnDutyDoctors(
  lat: number,
  lng: number,
  radiusKm: number
): Promise<NearbyDoctor[]> {
  const onDutyDoctors = await db
    .select({
      id: users.id,
      name: users.name,
      latitude: users.latitude,
      longitude: users.longitude,
    })
    .from(users)
    .where(and(eq(users.role, "doctor"), eq(users.status, "active"), eq(users.onDuty, true)));

  if (onDutyDoctors.length === 0) return [];

  const clinics = await db
    .select({
      id: doctorClinics.id,
      doctorId: doctorClinics.doctorId,
      clinicName: doctorClinics.clinicName,
      latitude: doctorClinics.latitude,
      longitude: doctorClinics.longitude,
    })
    .from(doctorClinics)
    .where(
      and(
        eq(doctorClinics.isActive, true),
        inArray(
          doctorClinics.doctorId,
          onDutyDoctors.map((d) => d.id)
        )
      )
    );

  const nearby: NearbyDoctor[] = [];
  const doctorsWithClinic = new Set<number>();

  for (const clinic of clinics) {
    const cLat = Number(clinic.latitude);
    const cLng = Number(clinic.longitude);
    if (!Number.isFinite(cLat) || !Number.isFinite(cLng)) continue;
    const dist = haversineKm(lat, lng, cLat, cLng);
    if (dist <= radiusKm) {
      const doctor = onDutyDoctors.find((d) => d.id === clinic.doctorId);
      doctorsWithClinic.add(clinic.doctorId);
      nearby.push({
        doctorId: clinic.doctorId,
        name: doctor?.name ?? "Doctor",
        clinicId: clinic.id,
        clinicName: clinic.clinicName,
        distanceKm: Math.round(dist * 100) / 100,
      });
    }
  }

  // Doctor-GPS fallback: no clinic coordinates in range, but the doctor
  // shared their own location while on duty — dispatch on that instead.
  for (const doctor of onDutyDoctors) {
    if (doctorsWithClinic.has(doctor.id)) continue;
    const dLat = Number(doctor.latitude);
    const dLng = Number(doctor.longitude);
    if (!Number.isFinite(dLat) || !Number.isFinite(dLng)) continue;
    const dist = haversineKm(lat, lng, dLat, dLng);
    if (dist <= radiusKm) {
      nearby.push({
        doctorId: doctor.id,
        name: doctor.name,
        clinicId: null,
        clinicName: `${doctor.name} (mobile)`,
        distanceKm: Math.round(dist * 100) / 100,
      });
    }
  }

  return nearby.sort((a, b) => a.distanceKm - b.distanceKm);
}
