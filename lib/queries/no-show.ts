import { cache } from "react";
import { and, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { appointments } from "@/lib/db/schema";

/**
 * Follow-up no-show prediction (§7.4, gated by the §9.2 AI rules).
 *
 * This is deliberately NOT a model — it is a transparent attendance-history
 * read, so the mechanics are explainable to the doctor who acts on it:
 *
 *   real problem       → the follow-up call list is ordered by creation, never
 *                        by urgency; a patient who has already missed every
 *                        recent visit is worth a call long before lunch;
 *   data availability  → the system's own definition of no-show is the
 *                        cancelled/(completed+cancelled) appointment ratio
 *                        (see getDoctorPerformance in lib/queries/analytics.ts);
 *   human approval     → the output is an advisory badge on the call list only.
 *                        NOTHING is auto-statused, auto-cancelled or hidden:
 *                        the human still owns every call and every status;
 *   fallback           → a patient with fewer than 2 recorded visit outcomes
 *                        gets "unknown", and the UI renders it as a muted dash
 *                        so absence of data never orders the list.
 */

export type NoShowBand = "low" | "medium" | "high" | "unknown";

export type NoShowStat = {
  patientId: number;
  /** Appointments that were attended (status "completed"). */
  completed: number;
  /** Appointments cancelled by either side — the system's no-show proxy. */
  cancelled: number;
  /** cancelled / (completed + cancelled), 0–100, or null when unknown. */
  riskPct: number | null;
  band: NoShowBand;
};

/** Pure banding rule — the query layer only gathers the counts it consumes. */
export function noShowBand(completed: number, cancelled: number): {
  riskPct: number | null;
  band: NoShowBand;
} {
  const total = completed + cancelled;
  if (total < 2) return { riskPct: null, band: "unknown" };
  const riskPct = Math.round((cancelled / total) * 100);
  if (riskPct >= 50) return { riskPct, band: "high" };
  if (riskPct >= 25) return { riskPct, band: "medium" };
  return { riskPct, band: "low" };
}

/** Label for the badge tooltip — always shows the raw arithmetic, never a claim. */
export function noShowReason(stat: NoShowStat): string {
  const total = stat.completed + stat.cancelled;
  switch (stat.band) {
    case "high":
      return `${stat.cancelled} of ${total} recent appointments were cancelled`;
    case "medium":
      return `${stat.cancelled} of ${total} recent appointments were cancelled`;
    case "low":
      return `attended ${stat.completed} of ${total} recent appointments`;
    case "unknown":
      return total === 0 ? "No visit history yet" : "Not enough visit history yet";
  }
}

/**
 * Per-patient no-show stats across ONE scoped doctor set. Only the requested
 * patient ids are read; the doctor scope gates the underlying appointment
 * rows, so a patient's history at ANOTHER practice never leaks in.
 * Returns a Map so the caller cannot forget a patient — missing key == not
 * in scope, and the UI treats every absence exactly like band "unknown".
 */
export const getPatientNoShowRisk = cache(
  async (doctorIds: number[], patientIds: number[]): Promise<Map<number, NoShowStat>> => {
    if (doctorIds.length === 0 || patientIds.length === 0) return new Map();

    const rows = await db
      .select({
        patientId: appointments.patientId,
        completed: sql<string>`sum(case when ${appointments.status} = 'completed' then 1 else 0 end)`,
        cancelled: sql<string>`sum(case when ${appointments.status} = 'cancelled' then 1 else 0 end)`,
      })
      .from(appointments)
      .where(
        and(
          inArray(appointments.doctorId, doctorIds),
          inArray(appointments.patientId, patientIds),
          // Terminal outcomes only — booked/upcoming rows say nothing yet.
          inArray(appointments.status, ["completed", "cancelled"])
        )
      )
      .groupBy(appointments.patientId);

    const map = new Map<number, NoShowStat>();
    for (const row of rows) {
      // appointments.patient_id is NOT NULL in the live schema; the guard
      // exists for the type, never for data.
      if (row.patientId == null) continue;
      const completed = Number(row.completed ?? 0);
      const cancelled = Number(row.cancelled ?? 0);
      const { riskPct, band } = noShowBand(completed, cancelled);
      map.set(row.patientId, { patientId: row.patientId, completed, cancelled, riskPct, band });
    }
    return map;
  }
);

/** One stat for a single patient (the Map lookup, not a second query). */
export function patientNoShow(
  risk: Map<number, NoShowStat>,
  patientId: number | null | undefined
): NoShowStat {
  if (patientId == null) {
    return { patientId: 0, completed: 0, cancelled: 0, riskPct: null, band: "unknown" };
  }
  return risk.get(patientId) ?? {
    patientId,
    completed: 0,
    cancelled: 0,
    riskPct: null,
    band: "unknown",
  };
}
