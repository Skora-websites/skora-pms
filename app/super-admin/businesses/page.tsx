import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses, businessClinics, users } from "@/lib/db/schema";
import { requireRole } from "@/lib/auth/guard";
import { PageHeader, EmptyState, StatusBadge } from "@/components/ui/dashboard-ui";
import { formatDate } from "@/lib/utils";
import { BusinessRowActions } from "./businesses-table";

export const metadata: Metadata = { title: "Businesses · Super Admin" };

export default async function SuperAdminBusinessesPage() {
  await requireRole(["super_admin"]);

  const rows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      email: businesses.email,
      phone: businesses.phone,
      address: businesses.address,
      isActive: businesses.isActive,
      createdAt: businesses.createdAt,
      ownerId: businesses.ownerId,
      ownerName: users.name,
      ownerEmail: users.email,
      ownerStatus: users.status,
      clinicCount: sql<number>`(SELECT count(*) FROM ${businessClinics} WHERE ${businessClinics.businessId} = ${businesses.id})`,
    })
    .from(businesses)
    .innerJoin(users, eq(users.id, businesses.ownerId))
    .orderBy(asc(businesses.id));

  return (
    <div>
      <PageHeader
        title="Businesses"
        subtitle="Organizations owned by business admins — deactivating a business hides its owner's admin views"
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No businesses registered"
          description="Businesses appear here when business admins are onboarded."
        />
      ) : (
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Owner</th>
                <th>Clinics</th>
                <th>Created</th>
                <th>Business status</th>
                <th>Owner status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td>
                    <p className="font-semibold text-ink">{b.name}</p>
                    <p className="text-xs text-slate-400">{b.email ?? b.slug}</p>
                  </td>
                  <td>
                    <p className="text-sm font-medium text-ink">{b.ownerName}</p>
                    <p className="text-xs text-slate-400">{b.ownerEmail}</p>
                  </td>
                  <td className="text-slate-500">{Number(b.clinicCount)}</td>
                  <td className="text-slate-500">{formatDate(b.createdAt)}</td>
                  <td>
                    <StatusBadge status={b.isActive === false ? "inactive" : "active"} />
                  </td>
                  <td>
                    <StatusBadge status={b.ownerStatus ?? "active"} />
                  </td>
                  <td>
                    <BusinessRowActions
                      businessId={b.id}
                      ownerId={b.ownerId}
                      ownerStatus={b.ownerStatus ?? "active"}
                      isActive={b.isActive !== false}
                    />
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
