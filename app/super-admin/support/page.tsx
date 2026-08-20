import type { Metadata } from "next";
import { Headset } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getAllSupportTickets } from "@/lib/queries/support";
import { getSupportVideos } from "@/lib/queries/super-admin";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui/dashboard-ui";
import { AdminTicketPanel } from "./ticket-panel";
import { TicketCloseButton } from "./ticket-close-button";
import { SupportVideosPanel } from "./support-videos-panel";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Support · Super Admin" };

export default async function SuperAdminSupportPage() {
  await requireRole(["super_admin", "admin"]);
  const [tickets, videos] = await Promise.all([getAllSupportTickets(), getSupportVideos()]);
  const open = tickets.filter((t) => t.status === "open");

  return (
    <div>
      <PageHeader
        title="Support inbox"
        subtitle={`${open.length} open ticket${open.length === 1 ? "" : "s"} in the queue`}
      />

      {tickets.length === 0 ? (
        <EmptyState icon={Headset} title="No tickets" description="Tickets from doctors and staff appear here." />
      ) : (
        <div className="space-y-4">
          {tickets.map((t) => (
            <div key={t.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                  <h3 className="font-display text-sm font-bold text-slate-900">{t.subject}</h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    #{t.id} · {t.userName} ({t.userRole}) · {timeAgo(t.createdAt)}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {t.status === "open" && <TicketCloseButton ticketId={t.id} />}
                  <StatusBadge status={t.status} />
                </div>
              </div>
              <AdminTicketPanel ticketId={t.id} messages={t.messages} />
            </div>
          ))}
        </div>
      )}

      <SupportVideosPanel
        videos={videos.map((v) => ({
          id: v.id,
          title: v.title,
          description: v.description,
          videoType: v.videoType ?? "youtube",
          videoUrl: v.videoUrl,
          videoPath: v.videoPath,
          createdAt: v.createdAt ? v.createdAt.toISOString() : null,
        }))}
      />
    </div>
  );
}
