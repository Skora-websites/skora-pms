// Dev-only: writes tiny placeholder PNGs into storage/uploads/landing/ for
// landing_items rows whose uploaded images were wiped from disk, so the
// public landing page (and its e2e smoke test) renders without 404s.
// ponytail: real uploads come from the CMS upload flow; delete this when the
// dev DB is re-seeded with real images.
import "dotenv/config";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { landingItems } from "../lib/db/schema";
import { db } from "../lib/db";

// Minimal valid 1x1 white PNG (IEND-terminated, CRCs included).
const PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6300010000050001" +
    "0a2db4470000000049454e44ae426082",
  "hex"
);

async function main() {
  const rows = await db.select().from(landingItems);
  const dir = "storage/uploads/landing";
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  for (const r of rows) {
    if (r.image?.startsWith("landing/") && !existsSync(`storage/uploads/${r.image}`)) {
      writeFileSync(`storage/uploads/${r.image}`, PNG);
      console.log("wrote", r.image);
    }
  }
  process.exit(0);
}
void main();
