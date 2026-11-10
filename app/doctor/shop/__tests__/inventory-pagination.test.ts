/**
 * getMedicineInventory — §5c shop server-side pagination.
 *
 * The REAL query module drives (no stubs needed: the helper takes no session
 * argument). What is under test, over a fixture window named
 * "Fixture medicine %":
 *
 *  1. the first page returns at most pageSize rows while `total` counts
 *     EVERY matching row — the header's "N medicines" stays true;
 *  2. the SQL aggregates (totalUnits, outOfStock) cover every matching row,
 *     not just the page (this is why they moved out of the page's JS);
 *  3. page 2 carries exactly the remaining rows, stable-ordered;
 *  4. the form filter narrows rows AND the chips (forms) list;
 *  5. search and form compose.
 *
 * Run: npm test (needs the live MySQL — same as the other fixture suites).
 */

import "dotenv/config";

import { test } from "node:test";
import assert from "node:assert/strict";
import { like } from "drizzle-orm";
import { db } from "@/lib/db";
import { medicines } from "@/lib/db/schema";
import { getMedicineInventory, type MedicineRow } from "@/lib/queries/doctor";

const PREFIX = "Fixture medicine";
const PAGE_SIZE = 24;

/** 28 medicines: A01..A26 (Tablet) + B01..B02 (Syrup). One Tablet row is out of stock. */
const A_COUNT = 26;
const B_COUNT = 2;
const OOS_INDEX = 3; // "Fixture medicine A04" → quantityAvailable 0
const EXPECTED_UNITS = A_COUNT + B_COUNT - 1; // A-rows carry 1 unit each, B-rows carry 1 each
const EXPECTED_NAMES = [
  ...Array.from({ length: A_COUNT }, (_, i) => `${PREFIX} A${String(i + 1).padStart(2, "0")}`),
  ...Array.from({ length: B_COUNT }, (_, i) => `${PREFIX} B${String(i + 1).padStart(2, "0")}`),
].sort();

async function seedWindow(): Promise<void> {
  const values = [
    ...Array.from({ length: A_COUNT }, (_, i) => ({
      name: `${PREFIX} A${String(i + 1).padStart(2, "0")}`,
      strength: "500",
      form: "Tablet",
      unit: "mg",
      quantityAvailable: i === OOS_INDEX ? 0 : 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    ...Array.from({ length: B_COUNT }, (_, i) => ({
      name: `${PREFIX} B${String(i + 1).padStart(2, "0")}`,
      strength: "100",
      form: "Syrup",
      unit: "ml",
      quantityAvailable: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  ];
  await db.insert(medicines).values(values);
}

async function cleanWindow(): Promise<void> {
  await db.delete(medicines).where(like(medicines.name, `${PREFIX}%`));
}

test("page 1 is bounded while the aggregates stay catalog-wide", async () => {
  await cleanWindow();
  try {
    await seedWindow();

    const data = await getMedicineInventory(PREFIX, undefined, { pageSize: PAGE_SIZE });
    assert.equal(data.rows.length, PAGE_SIZE);
    assert.equal(data.total, A_COUNT + B_COUNT);
    // Aggregates cover every matching row — NOT just the page. (Before the
    // rewrite these were computed in JS over the whole unbounded table.)
    assert.equal(data.totalUnits, EXPECTED_UNITS);
    assert.equal(data.outOfStock, 1);
    // Chips = distinct forms among matching rows, ascending.
    assert.deepEqual(data.forms, ["Syrup", "Tablet"]);
    // Stable order: name ASC with an id tiebreaker.
    const inPage = data.rows.map((m: MedicineRow) => m.name);
    assert.deepEqual(inPage, EXPECTED_NAMES.slice(0, PAGE_SIZE));
    assert.deepEqual([...inPage].sort(), inPage);
  } finally {
    await cleanWindow();
  }
});

test("page 2 carries the remaining rows; the form filter narrows rows and chips", async () => {
  await cleanWindow();
  try {
    await seedWindow();

    const page2 = await getMedicineInventory(PREFIX, undefined, { page: 2, pageSize: PAGE_SIZE });
    assert.equal(page2.rows.length, A_COUNT + B_COUNT - PAGE_SIZE);
    assert.deepEqual(
      page2.rows.map((m) => m.name),
      EXPECTED_NAMES.slice(PAGE_SIZE)
    );

    // Syrup-only: rows, totals and chips all narrow together.
    const syrups = await getMedicineInventory(PREFIX, "Syrup", { page: 1, pageSize: PAGE_SIZE });
    assert.equal(syrups.total, B_COUNT);
    assert.equal(syrups.rows.length, B_COUNT);
    assert.ok(syrups.rows.every((m) => m.form === "Syrup"));
    assert.deepEqual(syrups.forms, ["Syrup"]);
    assert.equal(syrups.totalUnits, B_COUNT);

    // Search + form compose: a Syrup-search miss yields a consistent empty page.
    const miss = await getMedicineInventory(`${PREFIX} A04`, "Syrup", { page: 1, pageSize: PAGE_SIZE });
    assert.equal(miss.total, 0);
    assert.equal(miss.rows.length, 0);
    assert.deepEqual(miss.forms, []);
  } finally {
    await cleanWindow();
  }
});
