"use client";

import { useState } from "react";
import { useActionState } from "react";
import { PackagePlus, X, Check } from "lucide-react";
import { addMedicine } from "./actions";

const initialState = { error: null as string | null };

export function AddMedicineForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(addMedicine, initialState);

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <PackagePlus className="h-4 w-4" />
        Add medicine
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900">Add a medicine</h3>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              action={formAction}
              onSubmit={() => {
                // Close on success (state.error stays null after a successful run)
                setTimeout(() => setOpen(false), 400);
              }}
              className="mt-5 space-y-4"
            >
              <div>
                <label className="label" htmlFor="med-name">Medicine name *</label>
                <input id="med-name" name="name" required placeholder="e.g. Paracetamol" className="input" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label" htmlFor="med-strength">Strength</label>
                  <input id="med-strength" name="strength" placeholder="500" className="input" />
                </div>
                <div>
                  <label className="label" htmlFor="med-form">Form</label>
                  <select id="med-form" name="form" className="input" defaultValue="Tablet">
                    {["Tablet", "Capsule", "Syrup", "Injection", "Ointment", "Drops", "Powder", "Inhaler"].map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="med-unit">Unit</label>
                  <select id="med-unit" name="unit" className="input" defaultValue="mg">
                    {["mg", "g", "mcg", "ml", "%", "IU"].map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {state.error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                  {state.error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={pending} className="btn-primary">
                  {pending ? (
                    "Adding…"
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Add to catalogue
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
