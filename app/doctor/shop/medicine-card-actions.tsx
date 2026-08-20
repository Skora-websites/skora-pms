"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteMedicine, editMedicine } from "./actions";

const initialState = { error: null as string | null };

type Medicine = {
  id: number;
  name: string;
  strength: string | null;
  form: string | null;
  unit: string | null;
};

const FORMS = ["Tablet", "Capsule", "Syrup", "Injection", "Ointment", "Drops", "Powder", "Inhaler"];
const UNITS = ["mg", "g", "mcg", "ml", "%", "IU"];

export function MedicineCardActions({ medicine }: { medicine: Medicine }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(editMedicine, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state !== initialState && state.error === null) {
      router.refresh();
      const t = setTimeout(() => setEditing(false), 0);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    const res = await deleteMedicine(medicine.id);
    if (res.error) alert(res.error);
    else router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          title="Edit medicine"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className={`rounded-lg p-1.5 transition-colors ${
            confirming ? "bg-red-50 text-red-600" : "text-slate-400 hover:bg-red-50 hover:text-red-600"
          }`}
          title={confirming ? "Click again to confirm" : "Delete medicine"}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setEditing(false)}
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900">Edit medicine</h3>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              action={(fd) => {
                fd.set("id", String(medicine.id));
                formAction(fd);
              }}
              className="mt-5 space-y-4"
            >
              <div>
                <label className="label" htmlFor="med-name-edit">Medicine name *</label>
                <input id="med-name-edit" name="name" required defaultValue={medicine.name} className="input" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label" htmlFor="med-strength-edit">Strength</label>
                  <input id="med-strength-edit" name="strength" defaultValue={medicine.strength ?? ""} className="input" />
                </div>
                <div>
                  <label className="label" htmlFor="med-form-edit">Form</label>
                  <select id="med-form-edit" name="form" className="input" defaultValue={medicine.form ?? "Tablet"}>
                    {FORMS.map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="med-unit-edit">Unit</label>
                  <select id="med-unit-edit" name="unit" className="input" defaultValue={medicine.unit ?? "mg"}>
                    {UNITS.map((u) => (
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
                <button type="button" onClick={() => setEditing(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={pending} className="btn-primary">
                  {pending ? "Saving…" : (
                    <>
                      <Check className="h-4 w-4" />
                      Save changes
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