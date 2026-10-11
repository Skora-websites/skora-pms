import "server-only";
import { PUBLIC_API_REFERENCE_ENABLED } from "@/lib/config";
import { assertPublicApiEnabled, containsLikelyPhi, fetchPublicJson } from "./client";
import { cached, cacheKey } from "./cache";

export type ReferenceItem = {
  title: string;
  authors: string;
  source: string;
  year: string;
  url: string;
};

type EuropePmcResult = {
  title?: string;
  authorString?: string;
  journalTitle?: string;
  pubYear?: string;
  doi?: string;
  id?: string | number;
};

/** Doctor reference search (read-only, non-diagnostic). Rejects likely-PHI queries. */
export async function searchReference(query: string): Promise<{ data: ReferenceItem[]; cached: boolean }> {
  assertPublicApiEnabled(PUBLIC_API_REFERENCE_ENABLED);
  const q = query.trim().slice(0, 120);
  if (q.length < 3) throw new Error("Query too short");
  if (containsLikelyPhi(q)) throw new Error("Query looks like patient data — use a clinical topic instead");
  const key = cacheKey(["ref", q]);
  return cached<ReferenceItem[]>(key, 24 * 3600, async () => {
    try {
      const raw = await fetchPublicJson<{ resultList?: { result?: EuropePmcResult[] } }>(
        "europepmc",
        `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(q)}&format=json&pageSize=8`
      );
      const rows = raw.resultList?.result ?? [];
      return rows.slice(0, 8).map((r) => ({
        title: (r.title ?? "Untitled").slice(0, 300),
        authors: (r.authorString ?? "").slice(0, 300),
        source: (r.journalTitle ?? "Europe PMC").slice(0, 120),
        year: String(r.pubYear ?? ""),
        url: r.doi
          ? `https://doi.org/${r.doi}`
          : r.id
            ? `https://europepmc.org/article/MED/${r.id}`
            : "https://europepmc.org",
      }));
    } catch {
      // Fallback: OpenAlex works catalog.
      const raw = await fetchPublicJson<{
        results?: Array<{ title?: string; publication_year?: number; doi?: string; id?: string }>;
      }>("openalex", `https://api.openalex.org/works?search=${encodeURIComponent(q)}&per-page=8`);
      return (raw.results ?? []).slice(0, 8).map((r) => ({
        title: (r.title ?? "Untitled").slice(0, 300),
        authors: "",
        source: "OpenAlex",
        year: String(r.publication_year ?? ""),
        url: r.doi ? `https://doi.org/${r.doi.replace(/^https?:\/\/doi\.org\//, "")}` : (r.id ?? "https://openalex.org"),
      }));
    }
  });
}

export type FoodInfo = { name: string; energyKcal: number | null; source: "openfoodfacts" };

/** Diet-counseling helper: food name -> kcal per 100g. */
export async function lookupFood(name: string): Promise<{ data: FoodInfo[]; cached: boolean }> {
  assertPublicApiEnabled(PUBLIC_API_REFERENCE_ENABLED);
  const q = name.trim().slice(0, 80);
  if (q.length < 2) throw new Error("Food name required");
  const key = cacheKey(["food", q]);
  return cached<FoodInfo[]>(key, 7 * 24 * 3600, async () => {
    const raw = await fetchPublicJson<{
      products?: Array<{ product_name?: string; nutriments?: { [k: string]: number } }>;
    }>("openfoodfacts", `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=5`);
    return (raw.products ?? []).slice(0, 5).map((p) => ({
      name: (p.product_name ?? q).slice(0, 120),
      energyKcal: p.nutriments?.["energy-kcal_100g"] ?? p.nutriments?.energy_100g ?? null,
      source: "openfoodfacts" as const,
    }));
  });
}
