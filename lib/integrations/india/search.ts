/**
 * Public search surface for the consultation form. Every call is:
 *  - kill-switch guarded (INDIA_API_ENABLED),
 *  - routed to the best available source per domain:
 *      diagnoses → NLM ICD-10-CM (real codes, keyless)
 *      history   → NLM Conditions (keyless)
 *      medicines → NLM RxTerms (keyless) merged with the Indian brand
 *                  snapshot — RxTerms indexes no Indian brands
 *      everything else → the committed Indian snapshot
 *    An operator-provided gateway (INDIA_API_BASE_URL) overrides all of it,
 *  - advisory-only — a failed lookup must never block a consultation save,
 *    so callers get an empty result set instead of an exception.
 */

import { searchDataset } from "./dataset";
import { fetchConditions, fetchIcd10Cm, fetchRxTerms } from "./live";
import { assertIndiaEnabled, fetchLiveItems, isLiveProvider } from "./provider";
import type { IndiaItem, IndiaKind, IndiaSearchResult } from "./types";

const NOTICE =
  "Reference only — clinical data (verify against the product insert before prescribing). Advisory; never blocks consultation save.";

/** Keyless live sources. `provider` is reported back through the route. */
const LIVE_SOURCES: Partial<
  Record<IndiaKind, { fetch: (q: string) => Promise<IndiaItem[]>; provider: string }>
> = {
  diagnoses: { fetch: fetchIcd10Cm, provider: "nlm-icd10cm" },
  history: { fetch: fetchConditions, provider: "nlm-conditions" },
  medicines: { fetch: fetchRxTerms, provider: "nlm-rxterms" },
};

/** Long or digit-heavy queries are treated as free prose, not a term lookup. */
function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ").slice(0, 120);
}

function indiaEnabled(): boolean {
  try {
    assertIndiaEnabled();
    return true;
  } catch {
    return false;
  }
}

function emptyResult(provider: string): IndiaSearchResult {
  return { data: [], cached: false, provider, notice: NOTICE };
}

export async function searchIndia(kind: IndiaKind, query: string, limit = 10): Promise<IndiaSearchResult> {
  const q = normalizeQuery(query);
  if (!indiaEnabled() || q.length < 1) return emptyResult("dataset");

  // Operator gateway seam (still keyless unless the operator adds auth at
  // their gateway): proxy everything to it when configured.
  if (isLiveProvider()) {
    try {
      const { items } = await fetchLiveItems(kind, q);
      if (items.length > 0) {
        const data = items.slice(0, limit);
        const local = searchDataset(kind, q, limit).filter((d) => !data.some((i) => i.label === d.label));
        return { data: [...data, ...local].slice(0, limit), cached: false, provider: "live+dataset", notice: NOTICE };
      }
    } catch {
      // Gateway down → the keyless/dataset path below keeps the picker alive.
    }
  }

  const live = LIVE_SOURCES[kind];
  if (live) {
    try {
      const items = (await live.fetch(q)).slice(0, limit);
      if (items.length > 0) {
        // Medicines: RxTerms has no Indian brands — merge both sources, but
        // rank an Indian brand that actually MATCHES the query above
        // RxTerms' fuzzy hits ("dolo" must surface Dolo 650 before
        // DOLOPHINE), then live results, then the remaining local rows.
        if (kind === "medicines") {
          const ql = q.toLowerCase();
          const starts = (s: string) => s.toLowerCase().startsWith(ql);
          const local = searchDataset("medicines", q, limit * 2);
          const localHit = local.filter((d) => starts(d.label));
          const liveHit = items.filter((i) => starts(i.label));
          const merged = [
            ...localHit,
            ...liveHit,
            ...items.filter((i) => !liveHit.includes(i)),
            ...local.filter((d) => !localHit.includes(d)),
          ];
          const seen = new Set<string>();
          const data: IndiaItem[] = [];
          for (const item of merged) {
            if (seen.has(item.label)) continue;
            seen.add(item.label);
            data.push(item);
            if (data.length >= limit) break;
          }
          return { data, cached: false, provider: "nlm-rxterms+dataset", notice: NOTICE };
        }
        return { data: items, cached: false, provider: live.provider, notice: NOTICE };
      }
    } catch {
      // Upstream failure → dataset fallback below.
    }
  }

  return { data: searchDataset(kind, q, limit), cached: false, provider: "dataset", notice: NOTICE };
}

// Named wrappers — the seven consultation-form domains.
export const searchIndiaMedicines = (q: string, limit?: number) => searchIndia("medicines", q, limit);
export const searchIndiaSymptoms = (q: string, limit?: number) => searchIndia("symptoms", q, limit);
export const searchIndiaExaminations = (q: string, limit?: number) => searchIndia("examinations", q, limit);
export const searchIndiaDiagnoses = (q: string, limit?: number) => searchIndia("diagnoses", q, limit);
export const searchIndiaLabTests = (q: string, limit?: number) => searchIndia("lab-tests", q, limit);
export const searchIndiaHistory = (q: string, limit?: number) => searchIndia("history", q, limit);
export const searchIndiaInstructions = (q: string, limit?: number) => searchIndia("instructions", q, limit);
