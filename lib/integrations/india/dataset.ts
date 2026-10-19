/**
 * Dataset provider — committed Indian clinical snapshots.
 *
 * The snapshots under `data/` are the default source because India has no
 * keyless production autocomplete API: CDSCO drug lists and the National
 * List of Essential Medicines ship as PDF/XLSX downloads, NAMASTE is a
 * registered portal, and commercial pharmacy APIs are all auth-gated. The
 * snapshots therefore make the consultation form work offline with zero
 * credentials; `scripts/import-india-datasets.mjs` documents the refresh
 * path, and `provider.ts` swaps in a live API via env without UI changes.
 *
 * Pure module: no DB import (runs under plain tsx for smoke tests), no
 * side effects beyond loading + normalizing JSON once per process.
 */

import { z } from "zod";
import medicinesJson from "./data/medicines.json";
import symptomsJson from "./data/symptoms.json";
import examinationsJson from "./data/examinations.json";
import diagnosesJson from "./data/diagnoses.json";
import labTestsJson from "./data/lab-tests.json";
import historyJson from "./data/history.json";
import instructionsJson from "./data/instructions.json";
import metaJson from "./data/meta.json";
import type { IndiaItem, IndiaKind } from "./types";

/** Dataset files are committed JSON, but they are still a trust boundary:
 *  parse once at load, drop malformed rows, and everything downstream is
 *  fully typed (repo convention: zod at the edge). */
const IndiaItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  detail: z.string().optional(),
  code: z.string().nullable().optional(),
  namaste: z.string().nullable().optional(),
  category: z.string().optional(),
  form: z.string().optional(),
  strength: z.string().optional(),
});

const MetaSchema = z.object({
  version: z.string().optional(),
  sources: z.array(z.string()).optional(),
});

const RAW: Record<IndiaKind, readonly unknown[]> = {
  medicines: medicinesJson,
  symptoms: symptomsJson,
  examinations: examinationsJson,
  diagnoses: diagnosesJson,
  "lab-tests": labTestsJson,
  history: historyJson,
  instructions: instructionsJson,
};

/** Normalized datasets, built once per process. */
const datasets = new Map<IndiaKind, IndiaItem[]>();
function load(kind: IndiaKind): IndiaItem[] {
  let items = datasets.get(kind);
  if (!items) {
    items = RAW[kind].flatMap((raw) => {
      const parsed = IndiaItemSchema.safeParse(raw);
      return parsed.success ? [parsed.data] : [];
    });
    datasets.set(kind, items);
  }
  return items;
}

export function datasetVersion(): string {
  return MetaSchema.parse(metaJson).version ?? "unknown";
}

export function datasetSources(): string[] {
  return MetaSchema.parse(metaJson).sources ?? [];
}

export function datasetCount(kind: IndiaKind): number {
  return load(kind).length;
}

/** Fields searched per kind — code/namaste are matched but not displayed. */
const SEARCH_FIELDS: Record<IndiaKind, Array<keyof IndiaItem>> = {
  medicines: ["label", "detail", "form", "strength", "category"],
  symptoms: ["label", "detail", "category"],
  examinations: ["label", "detail", "category"],
  diagnoses: ["label", "detail", "code", "namaste", "category"],
  "lab-tests": ["label", "detail", "category"],
  history: ["label", "detail", "code", "category"],
  instructions: ["label", "detail"],
};

const haystack = (item: IndiaItem, fields: Array<keyof IndiaItem>): string =>
  fields
    .map((f) => {
      const value = item[f];
      return typeof value === "string" ? value : "";
    })
    .join(" ")
    .toLowerCase();

/**
 * Ranked contains search: every query token must match (AND semantics), so
 * "met 500" finds "Metformin 500 mg". Prefix hits on the label outrank
 * mid-text hits; shorter labels outrank longer ones.
 */
export function searchDataset(kind: IndiaKind, query: string, limit = 10): IndiaItem[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length === 0 || tokens.length > 6) return [];

  const fields = SEARCH_FIELDS[kind];
  const scored: Array<{ item: IndiaItem; score: number }> = [];
  for (const item of load(kind)) {
    const hay = haystack(item, fields);
    if (!tokens.every((t) => hay.includes(t))) continue;
    const label = item.label.toLowerCase();
    let score = 0;
    if (label.startsWith(q)) score += 100;
    for (const t of tokens) {
      if (label.startsWith(t)) score += 40;
      const idx = label.indexOf(t);
      if (idx > 0) score += Math.max(0, 10 - idx);
    }
    // ICD/NAMASTE code exact hit is a strong signal for diagnosis lookups.
    if (item.code && item.code.toLowerCase() === q) score += 80;
    score += Math.max(0, 30 - label.length);
    scored.push({ item, score });
  }
  scored.sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label));
  return scored.slice(0, limit).map((s) => s.item);
}
