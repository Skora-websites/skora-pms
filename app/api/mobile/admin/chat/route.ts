import { getChatData } from "@/lib/queries/doctor";
import { apiOk, requireAdminActor } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/admin/chat — the shared "Doctors Group" room for an
 * admin-tier viewer.
 *
 * Wraps `getChatData` (lib/queries/doctor.ts:797) keyed on the viewer's own
 * `user.id`, exactly as `app/admin/chat/page.tsx:17` does — the room, the
 * mute setting and the clear watermark are per-user state, so the business
 * scope deliberately plays no part here (the page calls `getBusinessScope()`
 * not at all).
 *
 * **Chat is not realtime.** The web client polls at `POLL_MS = 5000`; this
 * route is a plain snapshot and must be polled the same way.
 */
export async function GET() {
  const actor = await requireAdminActor("/admin/chat");
  if (actor instanceof Response) return actor;

  const data = await getChatData(actor.user.id);
  return apiOk(data);
}
