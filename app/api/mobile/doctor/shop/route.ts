import { NextRequest } from "next/server";
import { getMedicineInventory } from "@/lib/queries/doctor";
import { LIST_HARD_CAP } from "@/lib/constants";
import { apiOk, requireDoctorModule } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/doctor/shop — the medicine inventory, searchable with
 * `?q=` and `?form=`, server-paginated with `?page=` (F-04, §5c).
 *
 * Wraps `getMedicineInventory` (lib/queries/doctor.ts). It is a platform-wide
 * catalog by design (the helper takes no identity argument), so it needs no
 * scoping resolution of its own — the module permission is the boundary.
 * Autocomplete reuses the existing `GET /api/medicines/search?q=`.
 *
 * The response is STILL the flat array the Expo client reads; `?page=`
 * advances through it in LIST_HARD_CAP-sized windows, so legacy clients
 * (no page param) keep today's behavior for any real catalog size.
 */
export async function GET(request: NextRequest) {
  const user = await requireDoctorModule("shop");
  if (user instanceof Response) return user;

  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? undefined;
  const form = searchParams.get("form") ?? undefined;
  const pageRaw = searchParams.get("page");
  const page = pageRaw ? Number(pageRaw) : undefined;

  const { rows, total } = await getMedicineInventory(
    q,
    form,
    Number.isFinite(page) ? { page, pageSize: LIST_HARD_CAP } : undefined
  );
  const response = apiOk(rows);
  response.headers.set("X-Total-Count", String(total));
  return response;
}
