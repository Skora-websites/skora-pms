/**
 * Shared types for the Indian clinical-data integration.
 *
 * One item shape across all datasets so the consultation form can render
 * every picker identically. Only `id` and `label` are universal; the rest
 * is populated where the source dataset carries it.
 */

/** The seven consultation-form clinical domains. */
export type IndiaKind =
  | "medicines"
  | "symptoms"
  | "examinations"
  | "diagnoses"
  | "lab-tests"
  | "history"
  | "instructions";

export const INDIA_KINDS: readonly IndiaKind[] = [
  "medicines",
  "symptoms",
  "examinations",
  "diagnoses",
  "lab-tests",
  "history",
  "instructions",
];

export type IndiaItem = {
  /** Stable slug inside its dataset (e.g. "dolo-650"). */
  id: string;
  /** Display text + what the picker inserts into the textarea. */
  label: string;
  /** Secondary line: composition, indication, template body… */
  detail?: string;
  /** ICD-10 code for diagnoses/conditions, where mapped. */
  code?: string | null;
  /** NAMASTE (Ministry of Ayush) terminology code, where mapped. */
  namaste?: string | null;
  /** Grouping: "Analgesic", "Investigation", "Chronic condition"… */
  category?: string;
  /** Medicines only: tablet/syrup/injection… */
  form?: string;
  /** Medicines only: "650 mg". */
  strength?: string;
};

export type IndiaSearchResult = {
  data: IndiaItem[];
  /** Always false: both providers cache in-process (dataset: per-process
   *  load; live: 10-minute TTL map) — there is no shared cache to hit. */
  cached: boolean;
  /** Which source actually served the result, surfaced by the route for
   *  debugging: "dataset" | "nlm-icd10cm" | "nlm-conditions" |
   *  "nlm-rxterms" | "nlm-rxterms+dataset" | "live" | "live+dataset". */
  provider: string;
  notice: string;
};
