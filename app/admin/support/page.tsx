import type { Metadata } from "next";
import { Headset } from "lucide-react";
import { requireAdminTier } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { getSupportTickets } from "@/lib/queries/doctor";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui/dashboard-ui";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Support · Business" };

/**
 * Business-owner support (D1 owner-parity): tickets raised by the owner's
 * own account plus their scoped practice doctors. Read-first — the owner
 * tracks escalations; replies still flow through the platform support team.
 */
export default async function AdminSupportPage() {
  await requireAdminTier("/admin/support");
  const scope = await getBusinessScope();

  // The owner's own tickets + every scoped doctor's tickets.
  const viewerIds = [await (await import("@/lib/auth/user")).getCurrentUser().then((u) => u!.id), ...scope.doctorIds];
  const uniqueIds = [...new Set(viewerIds)];
  const ticketLists = await Promise.all(uniqueIds.map((id) => getSupportTickets(id)));

  // Merge and dedupe by ticket id, newest first.
  const seen = new Set<number>();
  const tickets = ticketLists
    .flat()
    .filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)))
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));

  return (
    <div>
      <PageHeader
        title="Support"
        subtitle="Support tickets raised by you and your practice doctors"
      />

      <div className="space-y-4">
        {tickets.length === 0 ? (
          <EmptyState
            icon={Headset}
            title="No support tickets"
            description="Tickets from your account and your doctors' accounts will appear here."
          />
        ) : (
          tickets.map((t) => (
            <div key={t.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                  <h3 className="text-sm font-semibold text-ink">{t.subject}</h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    #{t.id} · {timeAgo(t.createdAt)}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <StatusBadge status={t.status} />
                </div>
              </div>
              <div className="divide-y divide-slate-50">
                {t.messages.slice(-3).map((m) => (
                  <div key={m.id} className="px-5 py-3">
                    <p className="text-xs font-semibold text-slate-400">
                      {m.senderName}
                      {m.isAdminReply && (
                        <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                          Support
                        </span>
                      )}
                      <span className="ml-2 font-normal">{timeAgo(m.createdAt)}</span>
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{m.message}</p>
                  </div>
                ))}
                {t.messages.length > 3 && (
                  <p className="px-5 py-2 text-xs text-slate-400">
                    {t.messages.length - 3} earlier message{t.messages.length - 3 === 1 ? "" : "s"} hidden
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
