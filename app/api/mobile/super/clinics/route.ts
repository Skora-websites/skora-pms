import { getClinics, getDoctorOptions } from "@/lib/queries/super-admin";
import { apiOk, requireSuperAdminActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/super/clinics — every clinic on the platform, plus the
 * doctor options the clinic form assigns.
 *
 * Wraps the two calls `app/super-admin/clinics/page.tsx:11` makes in its
 * single `Promise.all` — `getClinics` (super-admin.ts:229) and
 * `getDoctorOptions` (super-admin.ts:402), both platform-wide by design.
 * Guard: `requireApiRole(["super_admin"])`.
 */
export async function GET() {
  const user = await requireSuperAdminActor();
  if (user instanceof Response) return user;

  const [clinics, doctorOptions] = await Promise.all([
    getClinics(),
    getDoctorOptions(),
  ]);

  return apiOk({ clinics, doctorOptions });
}
