/**
 * Road-aware ETA for SOS pickup (audit P6).
 *
 * WHY: the ETA the patient's countdown shows was haversine / SOS_ETA_SPEED_KMH
 * — a straight line at a constant 30 km/h. Over any city with a river, a
 * railway line or a one-way grid that understates the trip badly, and the
 * patient watches a countdown that has no relationship to the van actually
 * driving. The standard fix (Uber/OSRM-based LLDs) is a road-distance call
 * with the straight-line value as the fallback.
 *
 * DESIGN CONSTRAINT: emergency dispatch must never BLOCK on a third party.
 * The old code computed inline with no network dependency, and that property
 * is worth more than accuracy. So:
 *
 *   - the seam (`EtaDeps.routeDistanceKm`) is injected, never fetched at module
 *     scope — a test replaces it, and an unconfigured deployment never calls
 *     out;
 *   - no provider is registered by default, so `estimateEtaMinutes` degrades
 *     to the previous haversine behaviour with NO deployment change;
 *   - every failure (throw, non-finite, absurd value) falls back rather than
 *     propagating, so a dead map API cannot cost a patient their ETA.
 *
 * `deps` are stored per-process (module-level), matching the transport-seam
 * pattern already used by lib/push/native.ts (`NativePushDeps`).
 */

import { SOS_ETA_SPEED_KMH } from "@/lib/config";

/** Travel-time estimate in minutes. */
export type EtaEstimate = {
  minutes: number;
  /** Which distance the estimate was based on. */
  basis: "road" | "straight-line";
};

export type EtaDeps = {
  /**
   * Road distance in km, or null when unavailable. Throwing is also
   * acceptable — the caller falls back.
   */
  routeDistanceKm: (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => Promise<number | null>;
};

const deps: { routeDistanceKm?: EtaDeps["routeDistanceKm"] } = {};

/** Register a road-distance provider (OSRM, Google, ...). Test seam. */
export function setEtaProvider(provider: EtaDeps["routeDistanceKm"] | null): void {
  deps.routeDistanceKm = provider ?? undefined;
}

/** True once a provider is registered — used by tests and diagnostics. */
export function hasEtaProvider(): boolean {
  return typeof deps.routeDistanceKm === "function";
}

/**
 * Straight-line ETA: the pre-P6 formula, kept as the fallback and as the
 * value used when the provider declines.
 *
 * The 1-minute floor is preserved deliberately: the patient's countdown
 * showing "0 min" for a doctor who is 200 m away reads as a bug, and a
 * sub-minute arrival is not an actionable number either way.
 */
export function straightLineEtaMinutes(distanceKm: number): number {
  return Math.max(1, Math.round((distanceKm / SOS_ETA_SPEED_KMH) * 60));
}

/**
 * ETA for a pickup. Degrades to the straight-line estimate on any failure.
 *
 * `straightLineKm` is passed in because the caller has already computed it
 * (it is the fare basis) — recomputing haversine here would duplicate the
 * one distance the dispatch already owns.
 */
export async function estimateEtaMinutes(params: {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  straightLineKm: number;
}): Promise<EtaEstimate> {
  const fallback = (): EtaEstimate => ({
    minutes: straightLineEtaMinutes(params.straightLineKm),
    basis: "straight-line",
  });

  const provider = deps.routeDistanceKm;
  if (!provider) return fallback();

  try {
    const roadKm = await provider(params.from, params.to);
    // A provider that cannot route (no road between the points, a coordinate
    // in the sea) returns null; a nonsensical number is treated the same way.
    // Straight-line is always a LOWER bound, so a road distance below it means
    // the provider is broken — never let it shorten the patient's countdown.
    if (roadKm === null || !Number.isFinite(roadKm) || roadKm <= 0) return fallback();
    if (roadKm < params.straightLineKm) return fallback();
    // Sanity ceiling: a >10x detour means a bad response, not a real trip.
    if (roadKm > params.straightLineKm * 10) return fallback();
    return { minutes: Math.max(1, Math.round((roadKm / SOS_ETA_SPEED_KMH) * 60)), basis: "road" };
  } catch {
    return fallback();
  }
}
