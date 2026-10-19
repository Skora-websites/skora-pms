import type { Metadata } from "next";
import { requireAdminTier } from "@/lib/auth/guard";
import { PageHeader, EmptyState } from "@/components/ui/dashboard-ui";
import { Bell } from "lucide-react";
import { getAdminNotifications } from "./actions";
import { NotificationsList } from "./notifications-list";

export const metadata: Metadata = { title: "Notifications · Business" };

/**
 * Admin-tier notification centre.
 *
 * The header's bell is shared across shells and used to point at
 * `/doctor/notifications`, which the doctor layout rejects for the
 * admin/manager tier — a dead link inside the owner's own panel (audit H8).
 * This route makes the bell resolve inside `/admin`.
 */
export default async function AdminNotificationsPage() {
  await requireAdminTier("/admin/notifications");

  const notifications = await getAdminNotifications();

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Clinic activity for your businesses — bookings, cancellations and system alerts."
      />
      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="Booking, cancellation and system alerts for your businesses appear here."
        />
      ) : (
        <NotificationsList notifications={notifications} />
      )}
    </>
  );
}
