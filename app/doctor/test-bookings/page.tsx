import type { Metadata } from "next";
import { TestTube2 } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getTestBookings } from "@/lib/queries/doctor";
import { PageHeader, StatusBadge, EmptyState } from "@/components/ui/dashboard-ui";
import { formatDateTime, formatINR } from "@/lib/utils";

export const metadata: Metadata = { title: "Test Bookings · Doctor" };

export default async function TestBookingsPage() {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
  const bookings = await getTestBookings(doctorId);

  return (
    <div>
      <PageHeader
        title="Test bookings"
        subtitle="Lab test bookings across vendors"
      />

      {bookings.length === 0 ? (
        <EmptyState
          icon={TestTube2}
          title="No test bookings yet"
          description="Bookings created for lab tests will appear here with their vendor and payment status."
        />
      ) : (
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Booking</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td className="font-semibold text-slate-900">{b.patientName}</td>
                  <td>{formatDateTime(b.bookingDate)}</td>
                  <td className="font-semibold">{formatINR(b.totalAmount)}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td className="max-w-xs truncate text-slate-500">{b.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
