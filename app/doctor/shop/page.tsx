import type { Metadata } from "next";
import { Search, Pill, SlidersHorizontal } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getMedicineInventory } from "@/lib/queries/doctor";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { AddMedicineForm } from "./add-medicine-form";
import { MedicineCardActions } from "./medicine-card-actions";

export const metadata: Metadata = { title: "Shop · Medicine Inventory · Doctor" };

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; form?: string }>;
}) {
  await requireRole(["doctor", "receptionist", "admin"]);
  const { q, form } = await searchParams;
  const inventory = await getMedicineInventory(q, form);

  const forms = [...new Set(inventory.map((m) => m.form).filter(Boolean))].sort() as string[];
  const activeForm = form ?? "";

  return (
    <div>
      <PageHeader
        title="Medicine Inventory"
        subtitle={`${inventory.length} medicine${inventory.length === 1 ? "" : "s"} in the shared catalogue`}
        action={<AddMedicineForm />}
      />

      {/* Search + filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <form className="relative min-w-[240px] flex-1" action="/doctor/shop">
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
              <form key={f} action="/doctor/shop">
                <input type="hidden" name="q" value={q ?? ""} />
                <button
                  type="submit"
                  name="form"
                  value={f}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    activeForm === f
                      ? "bg-brand-800 text-white"
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
          <h3 className="mt-4 font-display text-base font-bold text-slate-900">
            {q ? "No medicines match your search" : "The catalogue is empty"}
          </h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {q
              ? "Try a different keyword, or add a new medicine to the catalogue below."
              : "Add your first medicine to build your inventory catalogue."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {inventory.map((m) => (
            <div key={m.id} className="card card-hover group p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-700 to-accent-600 text-white shadow-md transition-transform group-hover:scale-105">
                    <Pill className="h-6 w-6" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-bold text-slate-900">{m.name}</h3>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {[m.strength, m.unit].filter(Boolean).join(" ")} · {m.form}
                    </p>
                  </div>
                </div>
                <MedicineCardActions medicine={m} />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
                <span className="rounded-full bg-accent-50 px-2.5 py-1 text-[11px] font-semibold text-accent-700">
                  In catalogue
                </span>
                <span className="text-[11px] text-slate-400">
                  Added {m.createdAt ? new Date(m.createdAt).toLocaleDateString("en-IN") : "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
