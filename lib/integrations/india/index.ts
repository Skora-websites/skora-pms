/**
 * Indian clinical-data integration — consultation-form suggestions.
 *
 * Default sources, all real APIs and all KEYLESS (no registration, no keys):
 *   diagnoses → NLM Clinical Tables ICD-10-CM (real morbidity codes)
 *   history   → NLM Clinical Tables Conditions
 *   medicines → NLM Clinical Tables RxTerms + the Indian brand snapshot
 *               (RxTerms indexes no Indian brands, so both are merged)
 *   symptoms / examinations / lab-tests / instructions → the committed
 *               Indian snapshot (no keyless API exists for these)
 * Any upstream failure falls back to the snapshot; kill switch
 * INDIA_API_ENABLED=0 blanks every search. Operators can override all
 * sources with their own gateway via INDIA_API_BASE_URL (optionally with a
 * key at the gateway) — same response shape, no UI change.
 *
 * Snapshot sources + refresh path: `scripts/import-india-datasets.mjs` and
 * `data/meta.json`. Verify every suggestion against the product insert
 * before prescribing — this is advisory data, never clinical truth.
 */

import "server-only";

export {
  searchIndia,
  searchIndiaMedicines,
  searchIndiaSymptoms,
  searchIndiaExaminations,
  searchIndiaDiagnoses,
  searchIndiaLabTests,
  searchIndiaHistory,
  searchIndiaInstructions,
} from "./search";
export { datasetVersion, datasetSources, datasetCount } from "./dataset";
export { IndiaDisabledError, IndiaUpstreamError, isLiveProvider } from "./provider";
export type { IndiaItem, IndiaKind, IndiaSearchResult } from "./types";
