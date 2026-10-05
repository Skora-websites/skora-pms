import type { Metadata } from "next";
import { Search, Pill, SlidersHorizontal } from "lucide-react";
import { requireAdminTier } from "@/lib/auth/guard";
import { getBusinessScope } from "@/lib/auth/scope";
import { getMedicineInventory } from "@/lib/queries/doctor";
import { PageHeader } from "@/components/ui/dashboard-ui";

export const metadata: Metadata = { title: "Shop · Medicine Inventory · Business" };

/**
 * Business-owner medicine catalogue (D1 owner-parity). Read-first view of
 * the shared catalogue — stock management stays with the doctors running
 * their clinics; the owner audits availability across the business.
 */
export default async function AdminShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; form?: string }>;
}) {
  await requireAdminTier("/admin/shop");
  await getBusinessScope(); // tier guard parity: only admin-tier viewers reach here
  const { q, form } = await searchParams;
  const inventory = await getMedicineInventory(q, form);
  const totalUnits = inventory.reduce((sum, m) => sum + (m.quantityAvailable ?? 0), 0);
  const outOfStock = inventory.filter((m) => (m.quantityAvailable ?? 0) <= 0).length;

  const forms = [...new Set(inventory.map((m) => m.form).filter(Boolean))].sort() as string[];
  const activeForm = form ?? "";

  return (
    <div>
      <PageHeader
        title="Medicine Inventory"
        subtitle={`${inventory.length} medicine${inventory.length === 1 ? "" : "s"} · ${totalUnits} unit${totalUnits === 1 ? "" : "s"} available${outOfStock > 0 ? ` · ${outOfStock} out of stock` : ""}`}
      />

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <form className="relative min-w-[240px] flex-1" action="/admin/shop">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by name, strength or form…"
            className="input !pl-10"
          />
        </form>
        {forms.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <SlidersHorizontal className="mr-1 h-4 w-4 text-slate-400" />
            {forms.map((f) => (
              <form key={f} action="/admin/shop">
                <input type="hidden" name="q" value={q ?? ""} />
                <button
                  type="submit"
                  name="form"
                  value={f}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    activeForm === f
                      ? "bg-brand-700 text-white shadow-pop"
                      : "bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-800"
                  }`}
                >
                  {f}
                </button>
              </form>
            ))}
          </div>
        )}
      </div>

      {inventory.length === 0 ? (
        <div className="card flex flex-col items-center px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <Pill className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-[17px] font-semibold tracking-[-0.01em] text-ink">
            {q ? "No medicines match your search" : "The catalogue is empty"}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {q ? "Try a different keyword." : "Doctors add medicines from their Shop module."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {inventory.map((m) => (
            <div key={m.id} className="card p-5">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-700 text-white shadow-md">
                  <Pill className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">{m.name}</h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {[m.strength, m.unit].filter(Boolean).join(" ")} · {m.form}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    (m.quantityAvailable ?? 0) > 0
                      ? "bg-accent-100 text-accent-800"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {(m.quantityAvailable ?? 0) > 0
                    ? `${m.quantityAvailable} unit${(m.quantityAvailable ?? 0) === 1 ? "" : "s"} in stock`
                    : "Out of stock"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
