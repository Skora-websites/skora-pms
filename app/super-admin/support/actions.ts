"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { supportTicketMessages } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/user";

export type AdminReplyState = { error: string | null };

export async function adminReplyToTicket(
  ticketId: number,
  message: string
): Promise<AdminReplyState> {
  const user = await getCurrentUser();
  if (!user || !["super_admin", "admin"].includes(user.role)) {
    return { error: "Not authorized." };
  }
  const text = message.trim();
  if (!text) return { error: "Message is required." };

  const now = new Date();
  await db.insert(supportTicketMessages).values({
    supportTicketId: ticketId,
    senderId: user.id,
    message: text,
    isAdminReply: true,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/super-admin/support");
  return { error: null };
}
