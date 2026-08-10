import { cache } from "react";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { supportTickets, supportTicketMessages, users } from "@/lib/db/schema";

export const getAllSupportTickets = cache(async () => {
  const tickets = await db
    .select({
      id: supportTickets.id,
      subject: supportTickets.subject,
      status: supportTickets.status,
      createdAt: supportTickets.createdAt,
      userName: users.name,
      userRole: users.role,
    })
    .from(supportTickets)
    .innerJoin(users, eq(users.id, supportTickets.userId))
    .orderBy(desc(supportTickets.createdAt));

  const withThreads = await Promise.all(
    tickets.map(async (t) => {
      const messages = await db
        .select({
          id: supportTicketMessages.id,
          message: supportTicketMessages.message,
          isAdminReply: supportTicketMessages.isAdminReply,
          createdAt: supportTicketMessages.createdAt,
          senderName: users.name,
        })
        .from(supportTicketMessages)
        .innerJoin(users, eq(users.id, supportTicketMessages.senderId))
        .where(eq(supportTicketMessages.supportTicketId, t.id))
        .orderBy(desc(supportTicketMessages.createdAt));
      return { ...t, messages };
    })
  );

  return withThreads;
});
