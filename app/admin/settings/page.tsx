import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { businesses, businessClinics, doctorClinics } from "@/lib/db/schema";
import { requireAdminTier } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { BusinessSettingsForm, type BusinessProfile } from "./settings-form";

export const metadata: Metadata = { title: "Business Settings · Business" };

/**
 * Owner-only business settings: an editable profile (name, slug, contact,
 * address, active toggle) with the linked-clinics summary. Managers never
 * reach this route (ownerOnly module map).
 */
export default async function AdminSettingsPage() {
  await requireAdminTier("/admin/settings");
  const scope = await getBusinessScope();

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
      clinicId: businessClinics.clinicId,
      clinicName: doctorClinics.clinicName,
      isPrimary: businessClinics.isPrimary,
    })
    .from(businesses)
    .leftJoin(businessClinics, eq(businessClinics.businessId, businesses.id))
    .leftJoin(doctorClinics, eq(doctorClinics.id, businessClinics.clinicId))
    .where(inArray(businesses.id, scope.businessIds.length ? scope.businessIds : [-1]))
    .orderBy(asc(businesses.id));

  // Collapse the joined rows into one block per business.
  const byBusiness = new Map<number, { profile: typeof rows[number]; clinics: { id: number; name: string | null; isPrimary: boolean | null }[] }>();
  for (const row of rows) {
    const entry = byBusiness.get(row.id) ?? {
      profile: row,
      clinics: [],
    };
    if (row.clinicId !== null) {
      entry.clinics.push({ id: row.clinicId, name: row.clinicName, isPrimary: row.isPrimary });
    }
    byBusiness.set(row.id, entry);
  }

  return (
    <div>
      <PageHeader
        title="Business settings"
        subtitle="Your business profile and linked clinics"
      />

      <div className="space-y-6">
        {[...byBusiness.values()].map(({ profile, clinics }) => {
          const editable: BusinessProfile = {
            id: profile.id,
            name: profile.name,
            slug: profile.slug,
            email: profile.email,
            phone: profile.phone,
            address: profile.address,
            isActive: profile.isActive !== false,
          };
          return (
            <div key={profile.id} className="card p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">
                      {profile.name}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {profile.slug} · since {profile.createdAt ? new Date(profile.createdAt).getFullYear() : "—"}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    profile.isActive === false
                      ? "bg-slate-100 text-slate-400"
                      : "bg-brand-50 text-brand-700"
                  }`}
                >
                  {profile.isActive === false ? "Inactive" : "Active"}
                </span>
              </div>

              <BusinessSettingsForm business={editable} />

              <div className="mt-6 border-t border-slate-100 pt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Linked clinics ({clinics.length})
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {clinics.map((c) => (
                    <li key={c.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-sm">
                      <span className="font-medium text-ink">
                        {c.name ?? `Clinic #${c.id}`}
                        {c.isPrimary ? (
                          <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                            Primary
                          </span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                  {clinics.length === 0 && (
                    <li className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-400">
                      No clinics linked yet — add one from the Clinics page.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
