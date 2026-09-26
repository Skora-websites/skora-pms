import type { Metadata } from "next";
import Link from "next/link";
import { TestTube2 } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import {
  getTestBookings,
  getVendors,
  getTests,
  resolvePracticeDoctorId,
} from "@/lib/queries/doctor";
import { listDoctorIdsFor } from "@/lib/queries/clinic";
import { PageHeader, EmptyState } from "@/components/ui/dashboard-ui";
import { TestBookingsTable } from "./test-bookings-table";
import { BookingForm } from "./booking-form";
import { VendorManager } from "./vendor-manager";
import { TestManager } from "./test-manager";

export const metadata: Metadata = { title: "Test Bookings · Doctor" };

export default async function TestBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const user = await requireRole(["doctor", "receptionist"]);
  const doctorId = resolvePracticeDoctorId(user);
  const params = await searchParams;

  // Owner doctors + receptionists see the practice's bookings; a member
  // doctor sees strictly their own.
  const doctorIds = await listDoctorIdsFor(user, doctorId);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const [{ rows: bookings, hasMore }, vendors, tests] = await Promise.all([
    getTestBookings(doctorIds, { status: params.status, q: params.q }, { page }),
    getVendors(doctorIds),
    getTests(doctorIds),
  ]);
  const pageParams = (p: number) =>
    `/doctor/test-bookings?${new URLSearchParams({
      ...(params.status ? { status: params.status } : {}),
      ...(params.q ? { q: params.q } : {}),
      ...(p > 1 ? { page: String(p) } : {}),
    }).toString()}`;

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

      {(page > 1 || hasMore) && (
        <div className="mt-5 flex items-center justify-center gap-3">
          {page > 1 && (
            <Link
              href={pageParams(page - 1)}
              className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-800"
            >
              Previous
            </Link>
          )}
          {hasMore && (
            <Link
              href={pageParams(page + 1)}
              className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-800"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}