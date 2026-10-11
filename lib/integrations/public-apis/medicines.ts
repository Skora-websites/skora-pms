import "server-only";
import { PUBLIC_API_MEDICINES_ENABLED } from "@/lib/config";
import { assertPublicApiEnabled, containsLikelyPhi, fetchPublicJson } from "./client";
import { cached, cacheKey } from "./cache";

/**
 * Medicine lookup via no-key US NLM + FDA sources (public-apis/public-apis
 * "Health" entries that require no auth):
 *  - RxNav RxNorm (rxnav.nlm.nih.gov): name autocomplete + RxCUI properties.
 *  - openFDA drug label / enforcement (api.fda.gov): SPL snippets + recalls.
 *    openFDA works without a key (240 req/min, 1000/day/IP); we stay keyless
 *    and cache aggressively so clinic traffic never approaches the cap.
 *
 * Server-side only, advisory-only: a doctor must verify before prescribing.
 * US-centric data — Indian brands often miss. Never blocks consultation save.
 */

export type MedicineSuggestion = { rxcui: string; name: string; score: string };
export type MedicineDetail = {
  rxcui: string;
  name: string;
  tty: string;
  synonym: string;
  /** Marketed dose forms (brand + clinical), capped at 8. */
  doseForms: Array<{ rxcui: string; name: string; tty: string }>;
  attribution: string;
};
export type DrugLabelInfo = {
  brandName: string;
  genericName: string;
  indications: string | null;
  warnings: string | null;
  dosage: string | null;
  boxedWarning: boolean;
  attribution: string;
};
export type DrugRecall = {
  product: string;
  reason: string;
  classification: string;
  status: string;
  firm: string;
  date: string;
};

function guardQuery(q: string, minLen: number, maxLen: number): string {
  const query = q.trim().slice(0, maxLen);
  if (query.length < minLen) throw new Error("Query too short");
  if (containsLikelyPhi(query)) throw new Error("Query looks like patient data — use a medicine name instead");
  return query;
}

/** Autocomplete a medicine name -> RxCUI candidates (RxNav approximateTerm). */
export async function searchMedicines(query: string): Promise<{ data: MedicineSuggestion[]; cached: boolean }> {
  assertPublicApiEnabled(PUBLIC_API_MEDICINES_ENABLED);
  const q = guardQuery(query, 2, 100);
  const key = cacheKey(["med-search", q]);
  return cached<MedicineSuggestion[]>(key, 30 * 24 * 3600, async () => {
    const raw = await fetchPublicJson<{
      approximateGroup?: { candidate?: Array<{ rxcui?: string; name?: string; score?: string }> };
    }>("rxnav", `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(q)}&maxEntries=8`);
    return (raw.approximateGroup?.candidate ?? []).slice(0, 8).map((c) => ({
      rxcui: String(c.rxcui ?? ""),
      name: String(c.name ?? "").slice(0, 200),
      score: String(c.score ?? ""),
    })).filter((c) => c.rxcui && c.name);
  });
}

/** RxCUI detail -> core properties + marketed dose forms. */
export async function getMedicineDetail(rxcui: string): Promise<{ data: MedicineDetail; cached: boolean }> {
  assertPublicApiEnabled(PUBLIC_API_MEDICINES_ENABLED);
  const id = rxcui.trim();
  if (!/^\d{1,8}$/.test(id)) throw new Error("Invalid RxCUI");
  const key = cacheKey(["med-detail", id]);
  return cached<MedicineDetail>(key, 90 * 24 * 3600, async () => {
    const props = await fetchPublicJson<{
      properties?: { name?: string; tty?: string; synonym?: string };
    }>("rxnav", `https://rxnav.nlm.nih.gov/REST/rxcui/${id}/properties.json`);
    const doseForms: MedicineDetail["doseForms"] = [];
    try {
      const rel = await fetchPublicJson<{
        relatedGroup?: { conceptGroup?: Array<{ tty?: string; conceptProperties?: Array<{ rxcui?: string; name?: string; tty?: string }> }> };
      }>("rxnav", `https://rxnav.nlm.nih.gov/REST/rxcui/${id}/related.json?tty=SBD+SCD`);
      for (const g of rel.relatedGroup?.conceptGroup ?? []) {
        for (const c of g.conceptProperties ?? []) {
          if (c.rxcui && c.name) {
            doseForms.push({ rxcui: String(c.rxcui), name: String(c.name).slice(0, 200), tty: String(c.tty ?? g.tty ?? "") });
          }
          if (doseForms.length >= 8) break;
        }
        if (doseForms.length >= 8) break;
      }
    } catch {
      // Dose forms are enrichment — the core properties already answer the call.
    }
    return {
      rxcui: id,
      name: (props.properties?.name ?? `RxCUI ${id}`).slice(0, 200),
      tty: String(props.properties?.tty ?? ""),
      synonym: (props.properties?.synonym ?? "").slice(0, 200),
      doseForms,
      attribution: "rxnav.nlm.nih.gov",
    };
  });
}

/** FDA structured label snippet for a brand/generic name (openFDA, keyless). */
export async function getDrugLabel(query: string): Promise<{ data: DrugLabelInfo | null; cached: boolean }> {
  assertPublicApiEnabled(PUBLIC_API_MEDICINES_ENABLED);
  const q = guardQuery(query, 2, 100);
  const key = cacheKey(["med-label", q]);
  return cached<DrugLabelInfo | null>(key, 30 * 24 * 3600, async () => {
    const quoted = `"${q.replace(/"/g, "")}"`;
    let raw: {
      results?: Array<{
        openfda?: { brand_name?: string[]; generic_name?: string[] };
        indications_and_usage?: string[];
        warnings?: string[];
        dosage_and_administration?: string[];
        boxed_warning?: string[];
      }>;
    };
    try {
      raw = await fetchPublicJson<typeof raw>(
        "openfda-label",
        `https://api.fda.gov/drug/label.json?search=openfda.brand_name:${encodeURIComponent(quoted)}+openfda.generic_name:${encodeURIComponent(quoted)}&limit=1`
      );
    } catch (err) {
      // openFDA returns 404 when nothing matches — that's "no label", not a failure.
      if (err instanceof Error && /upstream 404/.test(err.message)) return null;
      throw err;
    }
    const r = raw.results?.[0];
    if (!r) return null;
    const first = (a?: string[]) => (a?.[0] ?? "").slice(0, 600) || null;
    return {
      brandName: (r.openfda?.brand_name?.[0] ?? q).slice(0, 120),
      genericName: (r.openfda?.generic_name?.[0] ?? "").slice(0, 120),
      indications: first(r.indications_and_usage),
      warnings: first(r.warnings),
      dosage: first(r.dosage_and_administration),
      boxedWarning: Array.isArray(r.boxed_warning) && r.boxed_warning.length > 0,
      attribution: "open.fda.gov",
    };
  });
}

/** Open FDA enforcement (recall) records mentioning the product. */
export async function getDrugRecalls(query: string): Promise<{ data: DrugRecall[]; cached: boolean }> {
  assertPublicApiEnabled(PUBLIC_API_MEDICINES_ENABLED);
  const q = guardQuery(query, 2, 100);
  const key = cacheKey(["med-recall", q]);
  return cached<DrugRecall[]>(key, 7 * 24 * 3600, async () => {
    const quoted = `"${q.replace(/"/g, "")}"`;
    let raw: {
      results?: Array<{
        product_description?: string;
        reason_for_recall?: string;
        classification?: string;
        status?: string;
        recalling_firm?: string;
        recall_initiation_date?: string;
      }>;
    };
    try {
      raw = await fetchPublicJson<typeof raw>(
        "openfda-recall",
        `https://api.fda.gov/drug/enforcement.json?search=product_description:${encodeURIComponent(quoted)}&limit=3`
      );
    } catch (err) {
      // openFDA returns 404 when nothing matches — that's "no recalls", not a failure.
      if (err instanceof Error && /upstream 404/.test(err.message)) return [];
      throw err;
    }
    return (raw.results ?? []).slice(0, 3).map((r) => ({
      product: (r.product_description ?? q).slice(0, 200),
      reason: (r.reason_for_recall ?? "").slice(0, 300),
      classification: String(r.classification ?? "").slice(0, 40),
      status: String(r.status ?? "").slice(0, 40),
      firm: (r.recalling_firm ?? "").slice(0, 120),
      date: String(r.recall_initiation_date ?? ""),
    }));
  });
}
