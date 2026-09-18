"use client";

import { useState, useTransition } from "react";
import { Loader2, PackagePlus } from "lucide-react";
import { addMedicineStock, setMedicineQuantity } from "@/lib/actions/inventory";

/**
 * Inline stock control for a medicine card on the Medicine Inventory page:
 * a number input that ADDS to the available count (negative = remove),
 * plus a "Set" mode for stock-takes. Optimistic count update, reverts on error.
 */
export function MedicineStockControl({
  medicineId,
  initialQuantity,
}: {
  medicineId: number;
  initialQuantity: number;
}) {
  const [qty, setQty] = useState<number>(initialQuantity);
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (mode: "add" | "set") => {
    const n = Math.trunc(Number(value));
    if (!Number.isFinite(n) || (mode === "add" ? n === 0 : n < 0)) return;
    const prev = qty;
    setQty(mode === "add" ? qty + n : n); // optimistic
    setValue("");
    setError(null);
    startTransition(async () => {
      const res =
        mode === "add" ? await addMedicineStock(medicineId, n) : await setMedicineQuantity(medicineId, n);
      if (res.error) {
        setQty(prev);
        setError(res.error);
      }
    });
  };

  const tone =
    qty <= 0
      ? "bg-rose-100 text-rose-700"
      : qty <= 10
        ? "bg-amber-100 text-amber-800"
        : "bg-accent-50 text-accent-700";

  return (
    <div className="mt-4 border-t border-slate-50 pt-3">
      <div className="flex items-center justify-between gap-3">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone}`}>
          <PackagePlus className="h-3 w-3" />
          {qty} available
        </span>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            placeholder="Qty"
            min={0}
            step={1}
            disabled={pending}
            className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 focus:border-brand-400 focus:outline-none"
            aria-label="Stock quantity"
          />
          <button
            type="button"
            onClick={() => run("add")}
            disabled={pending || value === ""}
            className="inline-flex items-center gap-1 rounded-full bg-brand-700 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
            title="Add to available stock (use a negative number to remove)"
          >
            {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <PackagePlus className="h-3 w-3" />}
            Add
          </button>
          <button
            type="button"
            onClick={() => run("set")}
            disabled={pending || value === ""}
            className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-50"
            title="Set the exact available quantity (stock-take)"
          >
            Set
          </button>
        </div>
      </div>
      {error && <p className="mt-1 text-[11px] font-medium text-rose-600">{error}</p>}
    </div>
  );
}
