import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { chatRooms, messages, users } from "@/lib/db/schema";
import { requireApiRole } from "@/lib/auth/guard";
import { apiError, apiOk, csrfGuard, anchorDoctorId } from "@/app/api/mobile/_helpers";
import { isDupKey } from "@/lib/db/dup";
import { notifyUser } from "@/lib/notifications/service";

export const runtime = "nodejs";

async function getOrCreateDirectRoom(patientId: number, doctorId: number): Promise<number> {
  const roomName = `direct_p${patientId}_d${doctorId}`;
  const [room] = await db
    .select({ id: chatRooms.id })
    .from(chatRooms)
    .where(eq(chatRooms.name, roomName));
  if (room) return Number(room.id);

  try {
    const [created] = await db.insert(chatRooms).values({
      name: roomName,
      type: "direct",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return Number(created.insertId);
  } catch (err) {
    if (isDupKey(err)) {
      const [existing] = await db
        .select({ id: chatRooms.id })
        .from(chatRooms)
        .where(eq(chatRooms.name, roomName));
      if (existing) return Number(existing.id);
    }
    throw err;
  }
}

/**
 * GET /api/mobile/doctor/chat/patient/[patientId] — doctor loads direct chat with patient.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const user = await requireApiRole(["doctor"]);
  if (user instanceof Response) {
    return apiError(user.status === 401 ? "Unauthorized" : "Forbidden", user.status);
  }

  const { patientId: patientIdStr } = await params;
  const patientId = Number(patientIdStr);
  if (!Number.isInteger(patientId) || patientId <= 0) {
    return apiError("Invalid patient ID.", 400);
  }

  const [patient] = await db
    .select({
      id: users.id,
      name: users.name,
      phone: users.phone,
    })
    .from(users)
    .where(eq(users.id, patientId));

  if (!patient) {
    return apiError("Patient not found.", 404);
  }

  const doctorId = anchorDoctorId(user);
  const roomId = await getOrCreateDirectRoom(patientId, doctorId);

  const rawMessages = await db
    .select({
      id: messages.id,
      content: messages.content,
      senderId: messages.senderId,
      senderName: users.name,
      timestamp: messages.timestamp,
    })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.senderId))
    .where(eq(messages.chatRoomId, roomId))
    .orderBy(asc(messages.timestamp), asc(messages.id))
    .limit(100);

  const formattedMessages = rawMessages.map((m) => ({
    id: Number(m.id),
    senderId: Number(m.senderId),
    senderName: m.senderName || "User",
    content: m.content,
    timestamp: m.timestamp.toISOString(),
    isMine: Number(m.senderId) === Number(user.id),
  }));

  return apiOk({
    patient: {
      id: Number(patient.id),
      name: patient.name,
      phone: patient.phone,
    },
    messages: formattedMessages,
  });
}

/**
 * POST /api/mobile/doctor/chat/patient/[patientId] — doctor sends message to patient.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const forbidden = csrfGuard(request);
  if (forbidden) return forbidden;

  const user = await requireApiRole(["doctor"]);
  if (user instanceof Response) {
    return apiError(user.status === 401 ? "Unauthorized" : "Forbidden", user.status);
  }

  const { patientId: patientIdStr } = await params;
  const patientId = Number(patientIdStr);
  if (!Number.isInteger(patientId) || patientId <= 0) {
    return apiError("Invalid patient ID.", 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid input: JSON body required.", 400);
  }

  const raw = (body ?? {}) as Record<string, unknown>;
  const content = String(raw.content ?? "").trim();
  if (!content) return apiError("Message cannot be empty.", 400);
  if (content.length > 5000) return apiError("Message must be at most 5000 characters.", 400);

  const doctorId = anchorDoctorId(user);
  const roomId = await getOrCreateDirectRoom(patientId, doctorId);
  const now = new Date();

  const [inserted] = await db.insert(messages).values({
    chatRoomId: roomId,
    senderId: user.id,
    doctorId: doctorId,
    content,
    timestamp: now,
    createdAt: now,
    updatedAt: now,
  });

  // Notify patient of new doctor message
  void notifyUser({
    userId: patientId,
    title: `Message from Dr. ${user.name} 🩺`,
    message: content.length > 100 ? `${content.slice(0, 97)}…` : content,
    type: "chat",
    link: `/chat/${doctorId}`,
  });

  return apiOk({
    success: true,
    message: {
      id: Number(inserted.insertId),
      senderId: user.id,
      senderName: user.name || "Doctor",
      content,
      timestamp: now.toISOString(),
      isMine: true,
    },
  });
}
