import type { Metadata } from "next";
import { TestTube } from "lucide-react";
import { requireAdminTier } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { getTestBookings, getVendors, getTests } from "@/lib/queries/doctor";
import { PageHeader, EmptyState } from "@/components/ui/dashboard-ui";
import { TestBookingsTable } from "@/app/doctor/test-bookings/test-bookings-table";
import { BookingForm } from "@/app/doctor/test-bookings/booking-form";
import { VendorManager } from "@/app/doctor/test-bookings/vendor-manager";
import { TestManager } from "@/app/doctor/test-bookings/test-manager";

export const metadata: Metadata = { title: "Test Bookings · Business" };

/**
 * Admin-tier lab bookings: full booking CRUD (create / edit / status /
 * delete / upload-link regenerate) + vendor & test catalogue management
 * across the whole business. The shared doctor actions enforce the write
 * scope server-side.
 */
export default async function AdminTestBookingsPage() {
  await requireAdminTier("/admin/test-bookings");
  const scope = await getBusinessScope();
  const [{ rows: bookings }, vendors, tests] = await Promise.all([
    getTestBookings(scope.doctorIds, {}, { page: 1, pageSize: 50 }),
    getVendors(scope.doctorIds),
    getTests(scope.doctorIds),
  ]);

  return (
    <div>
      <PageHeader
        title="Test bookings"
        subtitle="Lab test bookings across your business"
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
          icon={TestTube}
          title="No test bookings yet"
          description="Create a booking for a lab test — the vendor gets a secure upload link and the bill syncs to income automatically."
        />
      ) : (
        <TestBookingsTable
          bookings={bookings}
          vendors={vendors}
          tests={tests}
          patientBaseHref="/admin/patients"
        />
      )}
    </div>
  );
}
