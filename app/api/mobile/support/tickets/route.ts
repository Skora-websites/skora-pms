import { NextRequest } from "next/server";
import { and, desc, eq, inArray, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { supportTickets, supportTicketMessages, users } from "@/lib/db/schema";
import { requireApiRole } from "@/lib/auth/guard";
import { apiOk, apiError } from "@/app/api/mobile/_helpers";

export const runtime = "nodejs";

export type SupportTicketMessageItem = {
  id: number;
  supportTicketId: number;
  message: string;
  isAdminReply: boolean | null;
  createdAt: Date | string | null;
  senderName: string | null;
};

export type SupportTicketItem = {
  id: number;
  userId: number;
  subject: string;
  status: "open" | "closed" | null;
  priority: string | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
  messages: SupportTicketMessageItem[];
};

/**
 * GET /api/mobile/support/tickets
 * Lists all support tickets for the current authenticated user.
 */
export async function GET() {
  const user = await requireApiRole([
    "patient",
    "doctor",
    "admin",
    "receptionist",
    "manager",
  ]);
  if (user instanceof Response) return user;

  const tickets = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.userId, user.id))
    .orderBy(desc(supportTickets.createdAt));

  if (tickets.length === 0) {
    return apiOk([]);
  }

  const allMessages = await db
    .select({
      id: supportTicketMessages.id,
      supportTicketId: supportTicketMessages.supportTicketId,
      message: supportTicketMessages.message,
      isAdminReply: supportTicketMessages.isAdminReply,
      createdAt: supportTicketMessages.createdAt,
      senderName: users.name,
    })
    .from(supportTicketMessages)
    .innerJoin(users, eq(users.id, supportTicketMessages.senderId))
    .where(
      inArray(
        supportTicketMessages.supportTicketId,
        tickets.map((t) => t.id)
      )
    )
    .orderBy(asc(supportTicketMessages.createdAt));

  const byTicket = new Map<number, SupportTicketMessageItem[]>();
  for (const m of allMessages) {
    const list = byTicket.get(m.supportTicketId) ?? [];
    list.push(m);
    byTicket.set(m.supportTicketId, list);
  }

  const result: SupportTicketItem[] = tickets.map((t) => ({
    id: t.id,
    userId: t.userId,
    subject: t.subject,
    status: t.status,
    priority: t.priority,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    messages: byTicket.get(t.id) ?? [],
  }));

  return apiOk(result);
}

/**
 * POST /api/mobile/support/tickets
 * Opens a new customer support ticket.
 * Body: {
 *   subject: string,
 *   message: string,
 *   priority?: "low" | "normal" | "high" | "urgent"
 * }
 */
export async function POST(req: NextRequest) {
  const user = await requireApiRole([
    "patient",
    "doctor",
    "admin",
    "receptionist",
    "manager",
  ]);
  if (user instanceof Response) return user;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body.", 400);
  }

  const subject = String(body?.subject ?? "").trim();
  const message = String(body?.message ?? "").trim();
  const priorityRaw = String(body?.priority ?? "normal").toLowerCase();
  const priority = ["low", "normal", "high", "urgent"].includes(priorityRaw)
    ? priorityRaw
    : "normal";

  if (!subject || subject.length < 3) {
    return apiError("Subject must be at least 3 characters long.", 400);
  }

  if (!message || message.length < 5) {
    return apiError("Message must be at least 5 characters long.", 400);
  }

  const now = new Date();

  const [insertTicket] = await db.insert(supportTickets).values({
    userId: user.id,
    subject,
    status: "open",
    priority,
    createdAt: now,
    updatedAt: now,
  });

  const ticketId = Number(insertTicket.insertId);

  const [insertMsg] = await db.insert(supportTicketMessages).values({
    supportTicketId: ticketId,
    senderId: user.id,
    message,
    isAdminReply: false,
    createdAt: now,
    updatedAt: now,
  });

  const createdMessage: SupportTicketMessageItem = {
    id: Number(insertMsg.insertId),
    supportTicketId: ticketId,
    message,
    isAdminReply: false,
    createdAt: now,
    senderName: user.name,
  };

  const createdTicket: SupportTicketItem = {
    id: ticketId,
    userId: user.id,
    subject,
    status: "open",
    priority,
    createdAt: now,
    updatedAt: now,
    messages: [createdMessage],
  };

  return apiOk(createdTicket, { status: 201 });
}
