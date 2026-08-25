"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { chatRooms, messages, favorites, userChatSettings, users } from "@/lib/db/schema";
import { getCurrentUser, hasPermission, homePathForRole } from "@/lib/auth/user";
import { authRateLimit } from "@/lib/security/rate-limit";

async function getChatRoomId(): Promise<number> {
  const [room] = await db.select().from(chatRooms).where(eq(chatRooms.name, "Doctors Group"));
  if (room) return Number(room.id);
  const [created] = await db
    .insert(chatRooms)
    .values({ name: "Doctors Group", type: "group", createdAt: new Date(), updatedAt: new Date() });
  return Number(created.insertId);
}

async function authedUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!["doctor", "receptionist", "admin"].includes(user.role)) {
    redirect(homePathForRole(user.role));
  }
  return user;
}

/** Chat module requires the chat-view permission (nav already filters it). */
async function requireChatView(user: { id: number }): Promise<boolean> {
  return hasPermission(user.id, "chat-view");
}

async function requireChatSend(user: { id: number }): Promise<boolean> {
  return hasPermission(user.id, "chat-send");
}

export type ChatActionResult = { error: string | null };

export async function sendChatMessage(
  _prev: ChatActionResult,
  formData: FormData
): Promise<ChatActionResult> {
  const user = await authedUser();
  if (!(await requireChatSend(user))) return { error: "You don't have permission to send messages." };
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { error: "Message cannot be empty." };
  const roomId = await getChatRoomId();

  await db.insert(messages).values({
    chatRoomId: roomId,
    senderId: user.id,
    doctorId: user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id,
    content,
    timestamp: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath("/doctor/chat");
  return { error: null };
}

/** Polls for messages newer than the last seen id. */
export async function pollChatMessages(sinceId: number) {
  const user = await authedUser();
  if (!(await requireChatView(user))) return [];
  const { allowed } = authRateLimit.chatPoll(user.id);
  if (!allowed) {
    // Quietly return nothing so the poller just retries next tick.
    return [];
  }
  const roomId = await getChatRoomId();
  const rows = await db
    .select({
      id: messages.id,
      content: messages.content,
      senderId: messages.senderId,
      senderName: users.name,
      timestamp: messages.timestamp,
    })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.senderId))
    .where(and(eq(messages.chatRoomId, roomId), isNull(messages.deletedAt), sql`${messages.id} > ${sinceId}`))
    .orderBy(desc(messages.id))
    .limit(50);

  return rows
    .reverse()
    .map((m) => ({ ...m, senderName: m.senderName ?? "Unknown" }));
}

export async function toggleChatFavorite(messageId: number) {
  const user = await authedUser();
  if (!(await requireChatView(user))) return;
  const [existing] = await db
    .select({ id: favorites.id })
    .from(favorites)
    .where(and(eq(favorites.userId, user.id), eq(favorites.messageId, messageId)));

  if (existing) {
    await db.delete(favorites).where(eq(favorites.id, existing.id));
  } else {
    await db.insert(favorites).values({
      userId: user.id,
      messageId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  revalidatePath("/doctor/chat");
}

export async function deleteChatMessage(messageId: number) {
  const user = await authedUser();
  if (!(await requireChatView(user))) return;
  await db
    .update(messages)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(messages.id, messageId), eq(messages.senderId, user.id)));
  revalidatePath("/doctor/chat");
}

export async function toggleChatMute() {
  const user = await authedUser();
  if (!(await requireChatView(user))) return;
  const roomId = await getChatRoomId();
  const now = new Date();
  const [existing] = await db
    .select({ id: userChatSettings.id, muted: userChatSettings.muted })
    .from(userChatSettings)
    .where(and(eq(userChatSettings.userId, user.id), eq(userChatSettings.chatRoomId, roomId)));

  if (existing) {
    await db
      .update(userChatSettings)
      .set({ muted: !existing.muted, updatedAt: now })
      .where(eq(userChatSettings.id, existing.id));
  } else {
    await db.insert(userChatSettings).values({
      userId: user.id,
      chatRoomId: roomId,
      muted: true,
      createdAt: now,
      updatedAt: now,
    });
  }
  revalidatePath("/doctor/chat");
}

export async function clearChat() {
  const user = await authedUser();
  if (!(await requireChatView(user))) return;
  const roomId = await getChatRoomId();
  const now = new Date();
  const [existing] = await db
    .select({ id: userChatSettings.id })
    .from(userChatSettings)
    .where(and(eq(userChatSettings.userId, user.id), eq(userChatSettings.chatRoomId, roomId)));

  if (existing) {
    await db
      .update(userChatSettings)
      .set({ lastClearedAt: now, updatedAt: now })
      .where(eq(userChatSettings.id, existing.id));
  } else {
    await db.insert(userChatSettings).values({
      userId: user.id,
      chatRoomId: roomId,
      lastClearedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }
  revalidatePath("/doctor/chat");
}

/** Edit one of your own messages (legacy ChatController@update parity). */
export async function updateChatMessage(messageId: number, content: string) {
  const user = await authedUser();
  if (!(await requireChatSend(user))) return { error: "You don't have permission to edit messages." };
  const text = String(content ?? "").trim();
  if (!text) return { error: "Message cannot be empty." };
  const [existing] = await db
    .select({ id: messages.id })
    .from(messages)
    .where(and(eq(messages.id, messageId), eq(messages.senderId, user.id)));
  if (!existing) return { error: "Message not found." };
  await db
    .update(messages)
    .set({ content: text, updatedAt: new Date() })
    .where(eq(messages.id, messageId));
  revalidatePath("/doctor/chat");
  return { error: null };
}
