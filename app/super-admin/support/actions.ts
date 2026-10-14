"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/user";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { supportTickets, supportTicketMessages, supportVideos } from "@/lib/db/schema";
import { MAX_IMAGE_BYTES } from "@/lib/config";

import { audit } from "@/lib/security/audit-log";

import { saveUploadedVideo, deleteStoredUpload } from "@/lib/uploads/media";

/** Shared super-admin guard + result type (previously in the one big actions.ts). */
export type AdminActionResult = { error: string | null };

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "super_admin") redirect("/login");
  return user;
}

// ── Support (close ticket) ──────────────────────────────────────────────────

export async function closeTicket(ticketId: number): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!Number.isInteger(ticketId)) return { error: "Invalid ticket ID." };

  const [ticket] = await db
    .select({ id: supportTickets.id, status: supportTickets.status })
    .from(supportTickets)
    .where(eq(supportTickets.id, ticketId));
  if (!ticket) return { error: "Ticket not found." };
  if (ticket.status === "closed") return { error: "Ticket is already closed." };

  await db
    .update(supportTickets)
    .set({ status: "closed", updatedAt: new Date() })
    .where(eq(supportTickets.id, ticketId));

  void audit.supportTicketCreated(admin.id, { action: "ticket_closed", ticketId });

  revalidatePath("/super-admin/support");
  return { error: null };
}

const TICKET_PRIORITIES = ["low", "normal", "high", "urgent"];

/** Set a support ticket's priority (low / normal / high / urgent). */
export async function setTicketPriority(
  ticketId: number,
  priority: string
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!Number.isInteger(ticketId)) return { error: "Invalid ticket ID." };
  if (!TICKET_PRIORITIES.includes(priority)) return { error: "Invalid priority." };

  const [ticket] = await db
    .select({ id: supportTickets.id })
    .from(supportTickets)
    .where(eq(supportTickets.id, ticketId));
  if (!ticket) return { error: "Ticket not found." };

  await db
    .update(supportTickets)
    .set({ priority, updatedAt: new Date() })
    .where(eq(supportTickets.id, ticketId));

  void audit.supportTicketCreated(admin.id, { action: "ticket_priority_changed", ticketId, priority });

  revalidatePath("/super-admin/support");
  return { error: null };
}

// ── Support videos (legacy `SupportController` videos) ──────────────────────

export async function storeSupportVideo(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const videoType = String(formData.get("video_type") ?? "youtube");
  const videoUrl = String(formData.get("video_url") ?? "").trim();

  if (!title) return { error: "Title is required." };
  if (title.length > 255) return { error: "Title must be at most 255 characters." };
  if (!["upload", "youtube"].includes(videoType)) return { error: "Invalid video type." };

  let videoPath: string | null = null;
  if (videoType === "upload") {
    const file = formData.get("video_file") as File | null;
    if (!file || file.size === 0) return { error: "Choose a video file to upload." };
    try {
      videoPath = await saveUploadedVideo(file);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Could not save the video." };
    }
  } else {
    if (!videoUrl) return { error: "Video URL is required for YouTube videos." };
    if (videoUrl.length > 255) return { error: "Video URL must be at most 255 characters." };
  }

  const [created] = await db
    .insert(supportVideos)
    .values({
      title,
      description: description || null,
      videoType: videoType as never,
      videoUrl: videoType === "youtube" ? videoUrl : null,
      videoPath,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .$returningId();

  void audit.fileUploaded(admin.id, { action: "support_video_created", videoId: Number(created.id), title });

  revalidatePath("/super-admin/support");
  return { error: null };
}

export async function deleteSupportVideo(videoId: number): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!Number.isInteger(videoId)) return { error: "Invalid video ID." };

  const [existing] = await db
    .select({ id: supportVideos.id, videoPath: supportVideos.videoPath })
    .from(supportVideos)
    .where(eq(supportVideos.id, videoId));
  if (!existing) return { error: "Video not found." };

  await db.delete(supportVideos).where(eq(supportVideos.id, videoId));
  await deleteStoredUpload(existing.videoPath);

  void audit.fileUploaded(admin.id, { action: "support_video_deleted", videoId });

  revalidatePath("/super-admin/support");
  return { error: null };
}

/**
 * Post an operator reply to a ticket.
 *
 * The super-admin ticket panel has always imported this action, but it was
 * never defined — the reply box was dead UI. Mirrors the patient-side
 * `replySupportTicket` with isAdminReply true and the actor's own id.
 */
export async function adminReplyToTicket(
  ticketId: number,
  reply: string
): Promise<AdminActionResult> {
  const admin = await requireAdmin();
  if (!Number.isInteger(ticketId)) return { error: "Invalid ticket." };

  const message = String(reply ?? "").trim();
  if (!message) return { error: "Reply is required." };
  if (message.length > 5000) return { error: "Reply must be at most 5000 characters." };

  const [ticket] = await db
    .select({ id: supportTickets.id, userId: supportTickets.userId, status: supportTickets.status })
    .from(supportTickets)
    .where(eq(supportTickets.id, ticketId))
    .limit(1);
  if (!ticket) return { error: "Ticket not found." };

  const now = new Date();
  await db.insert(supportTicketMessages).values({
    supportTicketId: ticketId,
    senderId: admin.id,
    message,
    isAdminReply: true,
    createdAt: now,
    updatedAt: now,
  });

  // An operator reply moves the ticket out of the un-owned "open" state.
  if (ticket.status === "open") {
    await db
      .update(supportTickets)
      .set({ status: "closed", updatedAt: now })
      .where(eq(supportTickets.id, ticketId));
  }

  void audit.supportTicketCreated(admin.id, { action: "admin_reply", ticketId });
  revalidatePath("/super-admin/support");
  return { error: null };
}
