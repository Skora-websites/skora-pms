import type { Metadata } from "next";
import { FileHeart } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/lib/db";
import { prescriptionRefillRequests, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { formatDate } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui/dashboard-ui";
import { resolveRefillRequest } from "@/app/doctor/actions";

export const metadata: Metadata = { title: "Refill Requests · Doctor" };
export const dynamic = "force-dynamic";

async function approveAction(formData: FormData) {
  "use server";
  const id = Number(formData.get("id"));
  if (id) await resolveRefillRequest(id, "approve");
}

async function rejectAction(formData: FormData) {
  "use server";
  const id = Number(formData.get("id"));
  if (id) await resolveRefillRequest(id, "reject");
}

export default async function DoctorRefillsPage() {
  const user = await requireRole(["doctor"]);

  const pendingRequests = await db
    .select({
      id: prescriptionRefillRequests.id,
      consultationId: prescriptionRefillRequests.consultationId,
      medicationName: prescriptionRefillRequests.medicationName,
      quantity: prescriptionRefillRequests.quantity,
      note: prescriptionRefillRequests.note,
      status: prescriptionRefillRequests.status,
      createdAt: prescriptionRefillRequests.createdAt,
      patientName: users.name,
    })
    .from(prescriptionRefillRequests)
    .leftJoin(users, eq(users.id, prescriptionRefillRequests.patientId))
    .where(eq(prescriptionRefillRequests.doctorId, user.id))
    .orderBy(desc(prescriptionRefillRequests.createdAt))
    .limit(50);

  return (
    <div>
      <PageHeader
        title="Prescription Refill Requests"
        subtitle="Review and respond to patient refill requests"
      />

      {pendingRequests.length === 0 ? (
        <EmptyState
          icon={FileHeart}
          title="No refill requests"
          description="Patient refill requests will appear here once submitted."
        />
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((req) => (
            <div key={req.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-ink">
                    {req.patientName ?? "Patient"} · Rx #{req.consultationId}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Requested {req.createdAt ? formatDate(req.createdAt) : ""}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                  req.status === "pending" ? "bg-amber-100 text-amber-800" :
                  req.status === "approved" ? "bg-green-100 text-green-800" :
                  req.status === "rejected" ? "bg-red-100 text-red-800" :
                  "bg-slate-100 text-slate-700"
                }`}>
                  {req.status}
                </span>
              </div>
              <div className="px-6 py-4 space-y-2 text-sm">
                <p><span className="font-medium text-slate-600">Medication:</span> {req.medicationName ?? "All / as prescribed"}</p>
                {req.quantity ? <p><span className="font-medium text-slate-600">Quantity:</span> {req.quantity}</p> : null}
                {req.note ? <p><span className="font-medium text-slate-600">Note:</span> {req.note}</p> : null}
              </div>
              {req.status === "pending" && (
                <div className="flex gap-2 border-t border-slate-100 px-6 py-3">
                  <form action={approveAction}>
                    <input type="hidden" name="id" value={req.id} />
                    <button type="submit" className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100">
                      Approve
                    </button>
                  </form>
                  <form action={rejectAction}>
                    <input type="hidden" name="id" value={req.id} />
                    <button type="submit" className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100">
                      Reject
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
