import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { supportTickets, supportTicketMessages, users } from "@/lib/db/schema";
import { requireApiRole } from "@/lib/auth/guard";
import { apiOk, apiError } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

/**
 * POST /api/mobile/support/tickets/[id]/messages
 * Add a reply message to a support ticket, or close the ticket.
 * Body: {
 *   action: "reply" | "close",
 *   message?: string
 * }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiRole([
    "patient",
    "doctor",
    "admin",
    "receptionist",
    "manager",
  ]);
  if (user instanceof Response) return user;

  const { id } = await params;
  const ticketId = Number(id);
  if (!ticketId || isNaN(ticketId)) {
    return apiError("Invalid ticket ID.", 400);
  }

  // 1. Fetch ticket and verify existence
  const [ticket] = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.id, ticketId))
    .limit(1);

  if (!ticket) {
    return apiError("Support ticket not found.", 404);
  }

  // Permission check: owner or admin/manager
  const isOwner = ticket.userId === user.id;
  const isAdmin = user.role === "admin" || user.role === "manager";
  if (!isOwner && !isAdmin) {
    return apiError("You do not have access to this support ticket.", 403);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body.", 400);
  }

  const action = body?.action === "close" ? "close" : "reply";
  const now = new Date();

  if (action === "close") {
    await db
      .update(supportTickets)
      .set({
        status: "closed",
        updatedAt: now,
      })
      .where(eq(supportTickets.id, ticketId));

    return apiOk({ success: true, status: "closed" });
  }

  // Reply message
  const message = String(body?.message ?? "").trim();
  if (!message) {
    return apiError("Message is required for a reply.", 400);
  }

  const [insertMsg] = await db.insert(supportTicketMessages).values({
    supportTicketId: ticketId,
    senderId: user.id,
    message,
    isAdminReply: isAdmin,
    createdAt: now,
    updatedAt: now,
  });

  // Re-open ticket if it was closed and user replies
  await db
    .update(supportTickets)
    .set({
      status: "open",
      updatedAt: now,
    })
    .where(eq(supportTickets.id, ticketId));

  return apiOk({
    success: true,
    message: {
      id: Number(insertMsg.insertId),
      supportTicketId: ticketId,
      message,
      isAdminReply: isAdmin,
      createdAt: now,
      senderName: user.name,
    },
  });
}
