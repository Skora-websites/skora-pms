import type { Metadata } from "next";
import { Headset } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getSupportTickets } from "@/lib/queries/doctor";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui/dashboard-ui";
import { NewTicketForm } from "./new-ticket";
import { TicketThread } from "./ticket-thread";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Support · Doctor" };

export default async function SupportPage() {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  const tickets = await getSupportTickets(user.id);

  return (
    <div>
      <PageHeader
        title="Support"
        subtitle="Get help from the SkoraCares team"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <EmptyState
              icon={Headset}
              title="No support tickets"
              description="Create a ticket and our team will get back to you."
            />
          ) : (
            tickets.map((t) => (
              <div key={t.id} className="card overflow-hidden">
                <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
                  <div>
                    <h3 className="font-display text-sm font-bold text-slate-900">{t.subject}</h3>
                    <p className="mt-0.5 text-xs text-slate-400">
                      #{t.id} · {timeAgo(t.createdAt)}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <StatusBadge status={t.status} />
                  </div>
                </div>
                <TicketThread ticketId={t.id} messages={t.messages} />
              </div>
            ))
          )}
        </div>

        <NewTicketForm />
      </div>
    </div>
  );
}
