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
  // Platform-operator surface only — the stale ["super_admin", "admin"]
  // admission let a tenant principal (business owner) post admin replies
  // (same role-list regression the APIs fixed as NV-1).
  if (!user || user.role !== "super_admin") {
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
