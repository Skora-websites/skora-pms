import { and, eq, gt, inArray, lt, sql } from "drizzle-orm";
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
 * The lat/lng extents that CONTAIN a haversine circle of `radiusKm`.
 *
 * Longitude degrees shrink with latitude (1° lon ≈ cos(lat) × 111.32 km), so
 * the east-west half-width is widened by 1/cos(clamped centre latitude) —
 * the standard corner-correcting box that stays a superset of the circle
 * anywhere on Earth below the poles. The haversine pass afterwards is what
 * actually decides "in radius"; the box only decides what reaches it.
 * Used in SQL with the numeric-coordinate indexes from migration 0027, this
 * turns discovery from "every active clinic of every on-duty doctor, walked
 * in JS" into an index range scan (§4 item 10 acceptance).
 */
export function boundingBox(
  lat: number,
  lng: number,
  radiusKm: number
): { latMin: number; latMax: number; lngMin: number; lngMax: number } {
  const KM_PER_DEG_LAT = 111.32;
  const latDelta = radiusKm / KM_PER_DEG_LAT;
  const lngDelta = radiusKm / (KM_PER_DEG_LAT * Math.max(0.01, Math.cos((lat * Math.PI) / 180)));
  return {
    latMin: lat - latDelta,
    latMax: lat + latDelta,
    lngMin: lng - lngDelta,
    lngMax: lng + lngDelta,
  };
}
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
  // Bounding-box prefilter (audit §4 item 10): the SQL indices from migration
  // 0027 do the first cut — haversine only sees rows already inside the box,
  // and both reads are index range scans instead of "every active clinic of
  // every on-duty doctor".
  const box = boundingBox(lat, lng, radiusKm);

  // ── In-box clinics of on-duty doctors (primary source) ──
  const clinicRows = await db
    .select({
      doctorId: users.id,
      doctorName: users.name,
      clinicId: doctorClinics.id,
      clinicName: doctorClinics.clinicName,
      cLat: doctorClinics.latitude,
      cLng: doctorClinics.longitude,
    })
    .from(doctorClinics)
    .innerJoin(users, eq(users.id, doctorClinics.doctorId))
    .where(
      and(
        // On-duty + active is the authority filter (kept even though the
        // composite index starts on on_duty — equality terms only help it).
        eq(users.role, "doctor"),
        eq(users.status, "active"),
        eq(users.onDuty, true),
        eq(doctorClinics.isActive, true),
        gt(doctorClinics.latitude, box.latMin.toFixed(7)),
        lt(doctorClinics.latitude, box.latMax.toFixed(7)),
        gt(doctorClinics.longitude, box.lngMin.toFixed(7)),
        lt(doctorClinics.longitude, box.lngMax.toFixed(7))
      )
    );

  const nearby: NearbyDoctor[] = [];
  const doctorsWithClinic = new Set<number>();

  for (const row of clinicRows) {
    const cLat = Number(row.cLat);
    const cLng = Number(row.cLng);
    // Junk coordinates can no longer pass the numeric columns, but an exact
    // haversine check still guards the box's corners.
    const dist = haversineKm(lat, lng, cLat, cLng);
    if (dist <= radiusKm) {
      doctorsWithClinic.add(row.doctorId);
      nearby.push({
        doctorId: row.doctorId,
        name: row.doctorName,
        clinicId: row.clinicId,
        clinicName: row.clinicName,
        distanceKm: Math.round(dist * 100) / 100,
      });
    }
  }

  // ── Doctor-GPS fallback (mobile dispatch) ──
  //
  // Same box scan on `users`. Semantics preserved exactly: a doctor whose
  // clinic was in radius is skipped (clinic entry already emitted); a doctor
  // whose clinic is out of radius — or has no usable coordinates at all —
  // still gets their OWN location considered, so nobody silently drops out
  // of the offer set when their clinic moved out of range.
  const mobileRows = await db
    .select({
      doctorId: users.id,
      doctorName: users.name,
      dLat: users.latitude,
      dLng: users.longitude,
    })
    .from(users)
    .where(
      and(
        eq(users.role, "doctor"),
        eq(users.status, "active"),
        eq(users.onDuty, true),
        gt(users.latitude, box.latMin.toFixed(7)),
        lt(users.latitude, box.latMax.toFixed(7)),
        gt(users.longitude, box.lngMin.toFixed(7)),
        lt(users.longitude, box.lngMax.toFixed(7))
      )
    );

  for (const doctor of mobileRows) {
    if (doctorsWithClinic.has(doctor.doctorId)) continue;
    const dLat = Number(doctor.dLat);
    const dLng = Number(doctor.dLng);
    if (!Number.isFinite(dLat) || !Number.isFinite(dLng)) continue;
    const dist = haversineKm(lat, lng, dLat, dLng);
    if (dist <= radiusKm) {
      nearby.push({
        doctorId: doctor.doctorId,
        name: doctor.doctorName,
        clinicId: null,
        clinicName: `${doctor.doctorName} (mobile)`,
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
