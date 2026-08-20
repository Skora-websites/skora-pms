import type { Metadata } from "next";
import { Bell, BellRing } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { PageHeader, EmptyState } from "@/components/ui/dashboard-ui";
import { getNotifications } from "./actions";
import { NotificationsList } from "./notifications-list";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications · Doctor" };

export default async function NotificationsPage() {
  await requireRole(["doctor", "receptionist", "admin"]);
  const notifications = await getNotifications();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Notifications"
        subtitle="Stay up to date with your clinic activity"
        action={
          unread > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-100 px-3 py-1 text-xs font-semibold text-accent-800">
              <BellRing className="h-3.5 w-3.5" />
              {unread} unread
            </span>
          ) : null
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="Notifications about appointments, billing and reports will appear here."
        />
      ) : (
        <NotificationsList
          notifications={notifications.map((n) => ({
            ...n,
            createdAtLabel: formatDate(n.createdAt),
          }))}
        />
      )}
    </div>
  );
}