import type { NoShowBand } from "@/lib/queries/no-show";
import { noShowReason, patientNoShow, type NoShowStat } from "@/lib/queries/no-show";

const BAND_STYLES: Record<Exclude<NoShowBand, "unknown">, string> = {
  high: "bg-rose-100 text-rose-700",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-accent-100 text-accent-800",
};

/**
 * Advisory no-show-risk badge for the follow-up call list (§7.4).
 *
 * Approval UX by construction: the badge only PRIORITIZES — it never
 * changes a status, and "unknown" (thin history) renders as a muted dash
 * so missing data never orders the doctor's list. The tooltip shows the
 * raw arithmetic the band was derived from.
 */
export function NoShowRiskBadge({
  risk,
  patientId,
}: {
  risk: Map<number, NoShowStat>;
  patientId: number | null | undefined;
}) {
  const stat = patientNoShow(risk, patientId);
  if (stat.band === "unknown") {
    return (
      <span
        className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-400"
        title={noShowReason(stat)}
      >
        —
      </span>
    );
  }
  const pct = stat.riskPct ?? 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${BAND_STYLES[stat.band]}`}
      title={noShowReason(stat)}
    >
      {pct >= 50 ? "High" : pct >= 25 ? "Medium" : "Low"} · {pct}%
    </span>
  );
}
