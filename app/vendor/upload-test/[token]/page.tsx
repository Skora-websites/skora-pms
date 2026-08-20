import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { testBookings, users, vendors } from "@/lib/db/schema";
import { UploadCloud, CheckCircle2 } from "lucide-react";
import { VendorUploadForm } from "./upload-form";

export const metadata: Metadata = { title: "Upload Test Report" };

type PageProps = { params: Promise<{ token: string }> };

export default async function VendorUploadPage({ params }: PageProps) {
  const { token } = await params;

  const [booking] = await db
    .select({
      id: testBookings.id,
      patientId: testBookings.patientId,
      vendorId: testBookings.vendorId,
      doctorId: testBookings.doctorId,
      status: testBookings.status,
      uploadedFilePath: testBookings.uploadedFilePath,
      tests: testBookings.tests,
      uploadLinkToken: testBookings.uploadLinkToken,
    })
    .from(testBookings)
    .where(eq(testBookings.uploadLinkToken, token));

  if (!booking) notFound();

  const [patient, vendor, doctor] = await Promise.all([
    db.select({ name: users.name, phone: users.phone }).from(users).where(eq(users.id, booking.patientId)),
    db.select({ name: vendors.name }).from(vendors).where(eq(vendors.id, booking.vendorId)),
    db.select({ name: users.name }).from(users).where(eq(users.id, booking.doctorId)),
  ]);

  const testList = (booking.tests as { name: string; price: number }[] | null) ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-accent-50 px-4 py-12">
      <div className="mx-auto max-w-lg">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-brand-900/5">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-700 to-accent-600 text-white">
              <UploadCloud className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-display text-xl font-extrabold text-slate-900">Upload test report</h1>
              <p className="text-sm text-slate-500">Secure link — only this booking can upload.</p>
            </div>
          </div>

          {booking.status === "completed" && booking.uploadedFilePath ? (
            <div className="mt-8 flex flex-col items-center rounded-2xl border border-accent-200 bg-accent-50 px-6 py-10 text-center">
              <CheckCircle2 className="h-10 w-10 text-accent-700" />
              <h2 className="mt-3 font-display text-base font-bold text-slate-900">Report already uploaded</h2>
              <p className="mt-1 text-sm text-slate-500">
                This booking is marked as completed. Contact the clinic if you need to upload again.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/70 p-5 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Doctor</p>
                    <p className="mt-0.5 font-semibold text-slate-800">{doctor[0]?.name ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Vendor</p>
                    <p className="mt-0.5 font-semibold text-slate-800">{vendor[0]?.name ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Patient</p>
                    <p className="mt-0.5 font-semibold text-slate-800">{patient[0]?.name ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tests</p>
                    <p className="mt-0.5 font-medium text-slate-700">
                      {testList.length ? testList.map((t) => t.name).join(", ") : "—"}
                    </p>
                  </div>
                </div>
              </div>

              <VendorUploadForm token={token} />
            </>
          )}
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">
          Powered by SkoraCares · Lab reports are stored securely and shared only with the treating doctor.
        </p>
      </div>
    </div>
  );
}