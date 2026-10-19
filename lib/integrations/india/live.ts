/**
 * Real, keyless live providers — NLM Clinical Table Search Service.
 *
 * No API keys, no registration, HTTPS, built exactly for autocomplete (the
 * same service that powers LHC-Forms autocomplete widgets):
 *
 *   /api/icd10cm/v3/search    → diagnoses with real ICD-10-CM codes
 *   /api/conditions/v3/search → medical-condition names (history/symptoms)
 *   /api/rxterms/v3/search    → drug names from RxNorm (RxTerms)
 *
 * US/global terminologies — none of them index Indian brands, which is why
 * the medicines picker merges this live source with the Indian brand
 * snapshot (live results first). Every call is short-timeout and cached
 * in-process; any failure falls back to the dataset provider.
 */

import { INDIA_API_TIMEOUT_MS } from "@/lib/config";
import { z } from "zod";
import { IndiaUpstreamError } from "./provider";
import type { IndiaItem, IndiaKind } from "./types";

const BASE = "https://clinicaltables.nlm.nih.gov/api";
const TTL_MS = 10 * 60 * 1000;
const MAX_LIST = 10;

/**
 * All three endpoints answer `[count, [ids], extra|null, [[…row cells]]]`.
 * Parsed as a plain array boundary + positional narrowing — a multi-element
 * z.tuple crashes in this zod/tsx combination, and the outer shape is all
 * the contract needs; row cells are narrowed below.
 */
const ResponseSchema = z.array(z.unknown());

const cell = (v: unknown): string => (v == null ? "" : String(v).trim());

/** Position 3 (row matrix) narrowed to `string[][]`, skipping junk rows. */
function rowsOf(payload: unknown): string[][] {
  if (!Array.isArray(payload) || payload.length < 4) return [];
  const rows = payload[3];
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((row): row is unknown[] => Array.isArray(row))
    .map((row) => row.map(cell))
    .filter((row) => row.some(Boolean));
}

const slug = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** In-process TTL cache — NLM is a shared public service; don't hammer it. */
const cache = new Map<string, { at: number; items: IndiaItem[] }>();

/** Raw cell rows for one query (no cache — each fetcher caches its items). */
async function fetchRows(
  source: IndiaKind,
  path: string,
  query: string,
  extra: Record<string, string> = {}
): Promise<string[][]> {
  const params = new URLSearchParams({ terms: query, maxList: String(MAX_LIST), ...extra });
  const url = `${BASE}${path}?${params.toString()}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), INDIA_API_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    if (!res.ok) throw new IndiaUpstreamError(source, res.status, res.statusText);
    const payload = ResponseSchema.safeParse(await res.json());
    if (!payload.success) throw new IndiaUpstreamError(source, 0, "malformed live response");
    return rowsOf(payload.data);
  } catch (err) {
    if (err instanceof IndiaUpstreamError) throw err;
    const message = err instanceof Error ? err.message : "fetch failed";
    throw new IndiaUpstreamError(source, 0, message);
  } finally {
    clearTimeout(timer);
  }
}

/** Cache lookup + store helpers keyed by the fetcher's kind + query. */
function readCache(source: IndiaKind, query: string): IndiaItem[] | null {
  const hit = cache.get(`${source}:${query.toLowerCase()}`);
  if (hit && hit.at + TTL_MS > Date.now()) return hit.items;
  if (hit) cache.delete(`${source}:${query.toLowerCase()}`);
  return null;
}

function writeCache(source: IndiaKind, query: string, items: IndiaItem[]): IndiaItem[] {
  cache.set(`${source}:${query.toLowerCase()}`, { at: Date.now(), items });
  return items;
}

/**
 * Diagnoses → ICD-10-CM rows `[code, name]`.
 * The only keyless live source that returns real morbidity codes.
 */
export async function fetchIcd10Cm(query: string): Promise<IndiaItem[]> {
  const memo = readCache("diagnoses", query);
  if (memo) return memo;
  // sf=code,name is REQUIRED — without display fields the endpoint answers
  // with an empty row matrix (verified live).
  const items = (
    await fetchRows("diagnoses", "/icd10cm/v3/search", query, { sf: "code,name" })
  ).map(([code, name]) => ({
    id: code || slug(name),
    label: name,
    code: code || null,
    namaste: null,
  }));
  return writeCache("diagnoses", query, items);
}

/**
 * Medical conditions → row `[name]` (plus an NLM concept id we don't surface).
 * Drives the medical-history picker alongside the Indian history snapshot.
 */
export async function fetchConditions(query: string): Promise<IndiaItem[]> {
  const memo = readCache("history", query);
  if (memo) return memo;
  const items = (await fetchRows("history", "/conditions/v3/search", query)).map(([name]) => ({
    id: slug(name),
    label: name,
    detail: "NLM medical-conditions list",
  }));
  return writeCache("history", query, items);
}

/**
 * Medicines → RxNorm/RxTerms display names, e.g. "metFORMIN (Oral Pill)".
 * US-derived; the consultation form merges these with the Indian brand
 * snapshot so doctors get both spellings.
 */
export async function fetchRxTerms(query: string): Promise<IndiaItem[]> {
  const memo = readCache("medicines", query);
  if (memo) return memo;
  const items = (await fetchRows("medicines", "/rxterms/v3/search", query)).map(([name]) => ({
    id: slug(name),
    label: name,
    detail: "RxNorm · RxTerms (generic; US terminology)",
    form: /\((.*?)\)/.exec(name)?.[1] ?? undefined,
  }));
  return writeCache("medicines", query, items);
}
