import { and, eq, gt, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, doctorClinics, sosOffers } from "@/lib/db/schema";
import { SOS_TTL_MIN } from "@/lib/config";
import { rankCandidates } from "./ranking";

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
/**
 * Offer-response history for a set of doctors, over a bounded recent window
 * (audit P5).
 *
 * The acceptance signal the ranking uses: how each doctor answered the offers
 * they were actually given. Bounded to the last 7 days and to the candidate
 * set specifically, so the query is a `GROUP BY doctor_id` over a small
 * indexed key rather than a table scan of the offer history.
 *
 * A doctor with no rows is simply absent from the map — `acceptanceRatio`
 * treats that as the neutral midpoint, so a new doctor is neither promoted
 * nor buried.
 */
async function loadAcceptanceStats(
  doctorIds: number[]
): Promise<Map<number, { accepted: number; declined: number }>> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      doctorId: sosOffers.doctorId,
      accepted: sql<number>`SUM(CASE WHEN ${sosOffers.status} = 'accepted' THEN 1 ELSE 0 END)`,
      declined: sql<number>`SUM(CASE WHEN ${sosOffers.status} = 'declined' THEN 1 ELSE 0 END)`,
    })
    .from(sosOffers)
    .where(and(inArray(sosOffers.doctorId, doctorIds), gt(sosOffers.createdAt, since)))
    .groupBy(sosOffers.doctorId);

  const map = new Map<number, { accepted: number; declined: number }>();
  for (const row of rows) {
    // MySQL SUM() returns null over an empty group and DECIMAL as a string —
    // coerce both, and clamp to a non-negative integer defensively.
    const accepted = Math.max(0, Math.round(Number(row.accepted ?? 0)) || 0);
    const declined = Math.max(0, Math.round(Number(row.declined ?? 0)) || 0);
    map.set(row.doctorId, { accepted, declined });
  }
  return map;
}

/**
 * Rank a discovery result by the dispatch score (audit P5).
 *
 * Distance alone preferred a doctor 400 m away who had declined five requests
 * this hour over an idle doctor 2 km out — the patient waits for somebody who
 * was never coming. The score blends distance with acceptance history (how
 * this doctor actually answers) and duty freshness (a doctor who flipped
 * on-duty 10 minutes ago is not in offer fatigue).
 *
 * Degrades gracefully and deliberately: no duty timestamp column exists in
 * the schema, so `onDutyMinutes` is always null here and the duty term is the
 * neutral 0.5 — a third of the weight that costs nothing. Adding the column
 * later lifts the signal without touching this function or its callers.
 *
 * Falls back to the plain distance sort when the stats query fails, so a
 * transient audit-table problem can never stop an emergency dispatch.
 */
export async function rankNearbyDoctors(nearby: NearbyDoctor[]): Promise<NearbyDoctor[]> {
  if (nearby.length <= 1) return nearby;
  try {
    const stats = await loadAcceptanceStats(nearby.map((d) => d.doctorId));
    return rankCandidates(
      nearby.map((d) => ({
        ...d,
        id: d.doctorId,
        distanceKm: d.distanceKm,
        accepted: stats.get(d.doctorId)?.accepted ?? 0,
        declined: stats.get(d.doctorId)?.declined ?? 0,
        // No duty timestamp column yet — neutral signal, see docstring.
        onDutyMinutes: null,
      }))
    );
  } catch {
    return [...nearby].sort((a, b) => a.distanceKm - b.distanceKm);
  }
}

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

  // Ranked by the dispatch score (audit P5), not distance alone: the score
  // blends pickup distance with each doctor's offer-acceptance history, so a
  // busy-but-near doctor no longer jumps an idle doctor who will actually
  // answer. Falls back to a pure distance sort if the stats read fails.
  return rankNearbyDoctors(nearby);
}
