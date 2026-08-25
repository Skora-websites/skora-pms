import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, doctorClinics } from "@/lib/db/schema";

/** Pending SOS requests expire after this many minutes (business TTL). */
export const SOS_TTL_MIN = 5;

/** Privacy-first masking until a doctor accepts: show initials only. */
export function maskPatient(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join(".") || "Patient";
}

export type NearbyDoctor = {
  doctorId: number;
  name: string;
  clinicId: number;
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
 * Find active on-duty doctors whose active clinics are within `radiusKm`
 * of the patient location. Only doctors with a valid clinic lat/lng are
 * candidates (doctor_clinics stores coordinates as varchar).
 */
export async function findNearbyOnDutyDoctors(
  lat: number,
  lng: number,
  radiusKm: number
): Promise<NearbyDoctor[]> {
  const onDutyDoctors = await db
    .select({ id: users.id, name: users.name })
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
  for (const clinic of clinics) {
    const cLat = Number(clinic.latitude);
    const cLng = Number(clinic.longitude);
    if (!Number.isFinite(cLat) || !Number.isFinite(cLng)) continue;
    const dist = haversineKm(lat, lng, cLat, cLng);
    if (dist <= radiusKm) {
      const doctor = onDutyDoctors.find((d) => d.id === clinic.doctorId);
      nearby.push({
        doctorId: clinic.doctorId,
        name: doctor?.name ?? "Doctor",
        clinicId: clinic.id,
        clinicName: clinic.clinicName,
        distanceKm: Math.round(dist * 100) / 100,
      });
    }
  }
  return nearby.sort((a, b) => a.distanceKm - b.distanceKm);
}
