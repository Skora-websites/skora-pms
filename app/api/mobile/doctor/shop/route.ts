import { NextRequest } from "next/server";
import { getMedicineInventory } from "@/lib/queries/doctor";
import { apiOk, requireDoctorModule } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/doctor/shop — the medicine inventory, searchable with
 * `?q=` and `?form=`.
 *
 * Wraps `getMedicineInventory` (lib/queries/doctor.ts:955) exactly as
 * `app/doctor/shop/page.tsx:18` calls it. It is a platform-wide catalog by
 * design (the helper takes no identity argument), so it needs no scoping
 * resolution of its own — the module permission is the boundary. Autocomplete
 * reuses the existing `GET /api/medicines/search?q=`.
 */
export async function GET(request: NextRequest) {
  const user = await requireDoctorModule("shop");
  if (user instanceof Response) return user;

  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? undefined;
  const form = searchParams.get("form") ?? undefined;

  const inventory = await getMedicineInventory(q, form);
  return apiOk(inventory);
}
