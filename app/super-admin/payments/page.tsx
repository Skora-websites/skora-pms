import type { Metadata } from "next";
import { CreditCard } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getRecentPackagePayments } from "@/lib/packages/fulfillment";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui/dashboard-ui";
import { formatINR } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Package Payments · Super Admin" };

export default async function PackagePaymentsPage() {
  await requireRole(["super_admin", "admin"]);
  const payments = await getRecentPackagePayments(100);

  const paid = payments.filter((p) => p.status === "paid");

  return (
    <div>
      <PageHeader
        title="Package payments"
        subtitle={`${paid.length} completed · ${payments.length} total attempts (latest first)`}
      />

      {payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No package payments yet"
          description="Doctor purchases from the pricing page or the renewal screen will appear here."
        />
      ) : (
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Doctor</th>
                <th>Package</th>
                <th>Period</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Access until</th>
                <th>Order / Payment</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="whitespace-nowrap">{p.createdAt ? formatDate(p.createdAt) : "—"}</td>
                  <td>
                    <p className="font-medium text-ink">{p.userName}</p>
                    <p className="text-xs text-slate-400">{p.userEmail ?? "—"}</p>
                  </td>
                  <td>{p.packageName}</td>
                  <td className="capitalize">{p.period}</td>
                  <td className="num">{formatINR(p.amount / 100)}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td className="whitespace-nowrap">
                    {p.accessUntil ? formatDate(p.accessUntil) : "—"}
                  </td>
                  <td className="text-xs text-slate-500">
                    <p>{p.razorpayOrderId}</p>
                    <p>{p.razorpayPaymentId ?? "—"}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
