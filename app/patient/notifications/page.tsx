import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guard";
import { PageHeader, EmptyState } from "@/components/ui/dashboard-ui";
import { Bell } from "lucide-react";
import { getPatientNotifications } from "./actions";
import { PatientNotificationsList } from "./notifications-list";

export const metadata: Metadata = { title: "Notifications · Patient" };
export const dynamic = "force-dynamic";

/**
 * Patient notification centre.
 *
 * Patients receive in-app notifications (appointment cancellations, visit
 * completions — see app/doctor/appointments/actions.ts) but had no surface to
 * read them: the header bell pointed nowhere for the patient shell. This route
 * closes that dead end.
 */
export default async function PatientNotificationsPage() {
  await requireRole(["patient"]);
  const notifications = await getPatientNotifications();

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Updates about your appointments, reports and records."
      />
      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="Updates about your appointments and records will appear here."
        />
      ) : (
        <PatientNotificationsList notifications={notifications} />
      )}
    </>
  );
}
