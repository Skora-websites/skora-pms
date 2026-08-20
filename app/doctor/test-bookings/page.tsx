import type { Metadata } from "next";
import { TestTube2 } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getTestBookings, getVendors, getTests } from "@/lib/queries/doctor";
import { PageHeader, EmptyState } from "@/components/ui/dashboard-ui";
import { TestBookingsTable } from "./test-bookings-table";
import { BookingForm } from "./booking-form";
import { VendorManager } from "./vendor-manager";
import { TestManager } from "./test-manager";

export const metadata: Metadata = { title: "Test Bookings · Doctor" };

export default async function TestBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const user = await requireRole(["doctor", "receptionist", "admin"]);
  const doctorId = user.role === "receptionist" ? (user.doctorId ?? user.id) : user.id;
  const params = await searchParams;

  const [bookings, vendors, tests] = await Promise.all([
    getTestBookings(doctorId, { status: params.status, q: params.q }),
    getVendors(doctorId),
    getTests(doctorId),
  ]);

  return (
    <div>
      <PageHeader
        title="Test bookings"
        subtitle="Lab test bookings across vendors"
        action={
          <div className="flex flex-wrap gap-2">
            <VendorManager vendors={vendors} />
            <TestManager tests={tests} />
            <BookingForm vendors={vendors} tests={tests} />
          </div>
        }
      />

      {bookings.length === 0 ? (
        <EmptyState
          icon={TestTube2}
          title="No test bookings yet"
          description="Create a booking for a lab test — the vendor gets a secure upload link and the bill syncs to income automatically."
        />
      ) : (
        <TestBookingsTable bookings={bookings} vendors={vendors} tests={tests} />
      )}
    </div>
  );
}