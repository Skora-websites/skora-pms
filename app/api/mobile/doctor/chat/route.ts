import { getChatData } from "@/lib/queries/doctor";
import { apiOk, requireDoctorModule } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * GET /api/mobile/doctor/chat — the last 200 messages of the shared
 * "Doctors Group" room.
 *
 * Wraps `getChatData` (lib/queries/doctor.ts:797) exactly as
 * `app/doctor/chat/page.tsx:12` calls it — keyed on the session's own
 * `user.id` (never a doctor id and never the business scope), because the
 * room, the mute setting, the clear watermark and the favorite flags are all
 * per-user state.
 *
 * **Chat is not realtime.** The web client polls at `POLL_MS = 5000` and the
 * app must do the same; this route returns a plain snapshot, so a client that
 * treats one response as a live stream will miss messages.
 */
export async function GET() {
  const user = await requireDoctorModule("chat");
  if (user instanceof Response) return user;

  const data = await getChatData(user.id);
  return apiOk(data);
}
