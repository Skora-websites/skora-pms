import type { Metadata } from "next";
import Link from "next/link";
import { Search, Pill, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { requireRole } from "@/lib/auth/guard";
import { getMedicineInventory } from "@/lib/queries/doctor";
import { PageHeader } from "@/components/ui/dashboard-ui";
import { MedicineStockControl } from "@/components/doctor/medicine-stock";
import { AddMedicineButton, MedicineCardActions } from "./medicine-forms";

export const metadata: Metadata = { title: "Shop · Medicine Inventory · Doctor" };

const PAGE_SIZE = 24;

/** Pager link that carries the active search and form filter. */
function pageHref(page: number, q?: string, form?: string): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (form) params.set("form", form);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/doctor/shop${qs ? `?${qs}` : ""}`;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; form?: string; page?: string }>;
}) {
  await requireRole(["doctor", "receptionist"]);
  const { q, form, page: pageParam } = await searchParams;
  const requestedPage = Number(pageParam);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const data0 = await getMedicineInventory(q, form, { page, pageSize: PAGE_SIZE });
  const pageCount = Math.max(1, Math.ceil(data0.total / PAGE_SIZE));
  // A stale page param beyond the last page (after deletions) resolves to
  // empty rows — treat it as the last page instead of a broken blank screen.
  const pageNumber = Math.min(page, pageCount);
  const data =
    pageNumber === page ? data0 : await getMedicineInventory(q, form, { page: pageNumber, pageSize: PAGE_SIZE });
  const inventory = data.rows;

  return (
    <div>
      <PageHeader
        title="Medicine Inventory"
        subtitle={`${data.total} medicine${data.total === 1 ? "" : "s"} in the shared catalogue · ${data.totalUnits} unit${data.totalUnits === 1 ? "" : "s"} available${data.outOfStock > 0 ? ` · ${data.outOfStock} out of stock` : ""}`}
        action={<AddMedicineButton />}
      />

      {/* Search + filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <form className="relative min-w-[240px] flex-1" action="/doctor/shop">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by name, strength or form…"
            aria-label="Search medicines by name, strength or form"
            className="input !pl-10"
          />
        </form>
        {data.forms.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <SlidersHorizontal className="mr-1 h-4 w-4 text-slate-400" />
            {data.forms.map((f) => (
              <form key={f} action="/doctor/shop">
                <input type="hidden" name="q" value={q ?? ""} />
                <button
                  type="submit"
                  name="form"
                  value={f}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    (form ?? "") === f
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
            {q
              ? "Try a different keyword to find a medicine."
              : "Add your first medicine to start tracking stock."}
          </p>
          {!q && (
            <div className="mt-5">
              <AddMedicineButton />
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {inventory.map((m) => (
              <div key={m.id} className="card card-hover group p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-700 text-white shadow-md transition-transform group-hover:scale-105">
                      <Pill className="h-6 w-6" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">{m.name}</h3>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {[m.strength, m.unit].filter(Boolean).join(" ")} · {m.form}
                      </p>
                    </div>
                  </div>
                  <MedicineCardActions
                    medicine={{
                      id: m.id,
                      name: m.name,
                      strength: m.strength,
                      form: m.form,
                      unit: m.unit,
                    }}
                  />
                </div>
                <MedicineStockControl medicineId={m.id} initialQuantity={m.quantityAvailable ?? 0} />
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Added {m.createdAt ? new Date(m.createdAt).toLocaleDateString("en-IN") : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {pageCount > 1 && (
            <nav
              aria-label="Catalogue pages"
              className="mt-8 flex items-center justify-center gap-3"
            >
              {pageNumber > 1 ? (
                <Link
                  href={pageHref(pageNumber - 1, q, form)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-brand-300 hover:text-brand-700"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-lg border border-slate-100 px-3 py-2 text-xs font-semibold text-slate-300">
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </span>
              )}
              <span className="text-xs text-slate-500">
                Page {pageNumber} of {pageCount} · {data.total} medicines
              </span>
              {pageNumber < pageCount ? (
                <Link
                  href={pageHref(pageNumber + 1, q, form)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-brand-300 hover:text-brand-700"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-lg border border-slate-100 px-3 py-2 text-xs font-semibold text-slate-300">
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </span>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
