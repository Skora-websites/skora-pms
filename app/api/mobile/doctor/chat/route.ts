import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { chatRooms, messages, userChatSettings } from "@/lib/db/schema";
import { requireApiPermission } from "@/lib/auth/guard";
import { isDupKey } from "@/lib/db/dup";
import { resolvePracticeDoctorId } from "@/lib/queries/doctor";
import { getChatData } from "@/lib/queries/doctor";
import { apiError, apiOk, redirectError, requireDoctorModule } from "@/app/api/mobile/_helpers";

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

/**
 * POST /api/mobile/doctor/chat — send a message to the "Doctors Group" room.
 *
 * An HTTP transcription of `sendChatMessage` (app/doctor/chat/actions.ts:51),
 * rule-for-rule: role + `chat-send` permission, trim, empty and length
 * checks with the same messages, the shared room resolver, and the same
 * insert shape (senderId from the session, doctorId from the practice-anchor
 * resolver, `content` ≤ 5000 chars). No revalidation call — the native
 * client owns its own 5-second poll.
 */
export async function POST(request: Request) {
  const user = await requireApiPermission(["doctor", "receptionist"], "chat-send");
  if (user instanceof Response) {
    return apiError(user.status === 401 ? "Unauthorized" : "Forbidden", user.status);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid input.", 400);
  }
  const raw = (body ?? {}) as Record<string, unknown>;
  const content = String(raw.content ?? "").trim();
  if (!content) return apiError("Message cannot be empty.", 400);
  if (content.length > 5000) return apiError("Message must be at most 5000 characters.", 400);

  const roomId = await getChatRoomId();
  await db.insert(messages).values({
    chatRoomId: roomId,
    senderId: user.id,
    doctorId: resolvePracticeDoctorId(user),
    content,
    timestamp: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return NextResponse.json({ error: null });
}

/**
 * PUT /api/mobile/doctor/chat — mute or unmute the room.
 *
 * Mirrors `toggleChatMute` (app/doctor/chat/actions.ts:161) but takes the
 * desired state explicitly instead of flipping a client-blind toggle: the
 * body is `{ "muted": boolean }`. Same first-row upsert with the
 * duplicate-key race stamped to the caller's desired state, same per-user
 * chat setting row.
 */
export async function PUT(request: Request) {
  const user = await requireApiPermission(["doctor", "receptionist"], "chat");
  if (user instanceof Response) {
    return apiError(user.status === 401 ? "Unauthorized" : "Forbidden", user.status);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid input.", 400);
  }
  const raw = (body ?? {}) as Record<string, unknown>;
  if (typeof raw.muted !== "boolean") {
    return apiError("Invalid input.", 400);
  }
  const muted = raw.muted;

  const roomId = await getChatRoomId();
  const now = new Date();
  const [existing] = await db
    .select({ id: userChatSettings.id, muted: userChatSettings.muted })
    .from(userChatSettings)
    .where(and(eq(userChatSettings.userId, user.id), eq(userChatSettings.chatRoomId, roomId)));

  if (existing) {
    await db
      .update(userChatSettings)
      .set({ muted, updatedAt: now })
      .where(eq(userChatSettings.id, existing.id));
  } else {
    try {
      await db.insert(userChatSettings).values({
        userId: user.id,
        chatRoomId: roomId,
        muted,
        createdAt: now,
        updatedAt: now,
      });
    } catch (err) {
      // Concurrent first-toggle race on the unique key — stamp the winner's
      // row with the desired state, exactly like the action's race handler.
      if (isDupKey(err)) {
        await db
          .update(userChatSettings)
          .set({ muted, updatedAt: now })
          .where(and(eq(userChatSettings.userId, user.id), eq(userChatSettings.chatRoomId, roomId)));
      } else {
        throw err;
      }
    }
  }

  return NextResponse.json({ error: null });
}

/**
 * The shared "Doctors Group" room resolver, transcribed from the chat
 * actions file (actions.ts:13-29): existing row, else create with a
 * duplicate-key race fallback.
 */
async function getChatRoomId(): Promise<number> {
  const [room] = await db.select().from(chatRooms).where(eq(chatRooms.name, "Doctors Group"));
  if (room) return Number(room.id);
  try {
    const [created] = await db
      .insert(chatRooms)
      .values({ name: "Doctors Group", type: "group", createdAt: new Date(), updatedAt: new Date() });
    return Number(created.insertId);
  } catch (err) {
    // Concurrent creation lost the race — the winner's row exists now.
    if (isDupKey(err)) {
      const [room] = await db.select().from(chatRooms).where(eq(chatRooms.name, "Doctors Group"));
      if (room) return Number(room.id);
    }
    throw err;
  }
}
