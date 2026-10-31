import { apiOk, requireDoctorModule } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/doctor/profile — the signed-in dashboard user's own
 * profile object.
 *
 * The profile page has no query helper of its own: `app/doctor/profile/page.tsx`
 * renders straight from the `user` its guard returns
 * (`requireRole(["doctor", "receptionist"])`, lib/auth/guard.ts:10). This
 * route returns that same object from the API-equivalent guard for the page's
 * `dashboard` module — no query of its own, so nothing can drift from what
 * the page shows.
 *
 * The photo and signature bytes are NOT re-served here — the existing byte
 * routes `GET /api/doctor/profile/photo` and
 * `GET /api/doctor/profile/signature` are used instead.
 */
export async function GET() {
  const user = await requireDoctorModule("dashboard");
  if (user instanceof Response) return user;

  return apiOk(user);
}
