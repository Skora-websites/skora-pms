#!/usr/bin/env node
/**
 * India dataset refresh — documents the upstream sources and validates a
 * candidate dataset directory against the committed schema.
 *
 * Why a script and not live fetching: none of these sources offer a keyless
 * production API (CDSCO/NLEM ship PDFs/XLSX, NAMASTE is a registered portal,
 * commercial pharmacy APIs are auth-gated). Refresh is therefore an
 * explicit operator step, and the app reads the committed snapshots.
 *
 * Sources:
 *   Medicines  — CDSCO approved-drug lists (cdscoonline.gov.in) and the
 *                National List of Essential Medicines 2022 (cdsco.gov.in,
 *                PDF → CSV). Map to: id, label ("Brand (Composition strength)"),
 *                detail, category, form, strength.
 *   Diagnoses  — WHO ICD-10 morbidity codes (icd.who.int / WHO CSV export).
 *                Keep the 3–5 character ICD-10 code in `code`.
 *   NAMASTE    — Ministry of Ayush NAMASTE portal terminology export
 *                (namaste.ayush.gov.in; registration required). Populate
 *                `namaste` from the official export only — never hand-author.
 *   Symptoms / examinations / lab-tests / history / instructions — curated
 *   clinical vocabulary; keep `id` stable and labels insertion-ready.
 *
 * Usage:
 *   node scripts/import-india-datasets.mjs --check            # validate committed data
 *   node scripts/import-india-datasets.mjs --dir <path>       # validate a candidate dir
 *
 * --apply is intentionally absent: copying files is a human decision made
 * after review (a bad dataset is worse than a stale one).
 */
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.resolve(process.cwd(), "lib/integrations/india/data");
const REQUIRED_FILES = [
  "meta.json",
  "medicines.json",
  "symptoms.json",
  "examinations.json",
  "diagnoses.json",
  "lab-tests.json",
  "history.json",
  "instructions.json",
];

let failures = 0;

const argv = process.argv.slice(2);
const dirIndex = argv.indexOf("--dir");
const args = { dir: dirIndex >= 0 ? argv[dirIndex + 1] : null };

function fail(file, message) {
  failures += 1;
  console.error(`✗ ${file}: ${message}`);
}

for (const file of REQUIRED_FILES) {
  const full = path.join(args.dir ?? DATA_DIR, file);
  if (!fs.existsSync(full)) {
    fail(file, "missing");
    continue;
  }
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(full, "utf8"));
  } catch (err) {
    fail(file, `invalid JSON — ${err.message}`);
    continue;
  }
  if (file === "meta.json") {
    if (!parsed.version) fail(file, "meta.json needs a version");
    console.log(`✓ ${file} (dataset v${parsed.version})`);
    continue;
  }
  if (!Array.isArray(parsed)) {
    fail(file, "expected an array");
    continue;
  }
  const ids = new Set();
  for (const [i, row] of parsed.entries()) {
    if (typeof row?.id !== "string" || !row.id) fail(file, `row ${i}: missing id`);
    if (typeof row?.label !== "string" || !row.label) fail(file, `row ${i}: missing label`);
    if (ids.has(row?.id)) fail(file, `duplicate id "${row.id}"`);
    ids.add(row?.id);
  }
  console.log(`✓ ${file} — ${parsed.length} rows`);
}

if (failures > 0) {
  console.error(`\n${failures} problem(s) found.`);
  process.exit(1);
}
console.log("\nDataset check passed.");
