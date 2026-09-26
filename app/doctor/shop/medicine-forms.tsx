"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Loader2, PackagePlus, Pencil, Trash2, XCircle } from "lucide-react";
import {
  createMedicine,
  updateMedicine,
  deleteMedicine,
  type StockActionResult,
} from "@/lib/actions/inventory";

const initialState: StockActionResult = { error: null };

const FORMS = ["Tablet", "Capsule", "Syrup", "Injection", "Drops", "Cream", "Ointment", "Powder", "Inhaler", "Other"];
const UNITS = ["mg", "ml", "g", "mcg", "IU", "%"];

type MedicineFormProps = {
  mode: "create" | "edit";
  medicine?: { id: number; name: string; strength: string | null; form: string | null; unit: string | null };
  open: boolean;
  onClose: () => void;
};

/** Add / Edit dialog — same validation rules as super-admin Masters (name unique, ≤255). */
function MedicineDialogForm({ mode, medicine, open, onClose }: MedicineFormProps) {
  const action = mode === "create" ? createMedicine : updateMedicine;
  const [state, formAction, pending] = useActionState(action, initialState);
  const awaitingClose = useRef(false);

  // Close after a successful server-action round-trip (same pattern as the
  // follow-up forms): pending flips false and no error came back. Errors
  // keep the dialog open.
  useEffect(() => {
    if (awaitingClose.current && !pending && state.error === null) {
      awaitingClose.current = false;
      onClose();
    }
  }, [pending, state, onClose]);

  // A dialog that isn't open must not keep rendering stale state.
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">
            {mode === "create" ? "Add medicine" : "Edit medicine"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink"
            aria-label="Close"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          {mode === "create"
            ? "New catalogue entry — stock is set to 0; add units from the card afterwards."
            : "Update the catalogue entry. Prescriptions reference names, so history stays intact."}
        </p>
        <form
          key={medicine?.id ?? "new"}
          action={formAction}
          onSubmit={() => { awaitingClose.current = true; }}
          className="mt-5 space-y-4"
        >
          {mode === "edit" && <input type="hidden" name="medicine_id" value={medicine?.id} />}
          <div>
            <label htmlFor="med_name" className="label">Name</label>
            <input
              id="med_name"
              name="name"
              required
              maxLength={255}
              defaultValue={medicine?.name ?? ""}
              placeholder="e.g. Paracetamol"
              className="input"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="med_strength" className="label">Strength</label>
              <input
                id="med_strength"
                name="strength"
                maxLength={255}
                defaultValue={medicine?.strength ?? ""}
                placeholder="500"
                className="input"
              />
            </div>
            <div>
              <label htmlFor="med_form" className="label">Form</label>
              <select id="med_form" name="form" defaultValue={medicine?.form ?? "Tablet"} className="input">
                {FORMS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="med_unit" className="label">Unit</label>
              <select id="med_unit" name="unit" defaultValue={medicine?.unit ?? "mg"} className="input">
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          {state.error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          )}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
              {pending ? "Saving…" : mode === "create" ? "Add medicine" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Page-header button + "add medicine" dialog. */
export function AddMedicineButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-primary">
        <PackagePlus className="h-4 w-4" />
        Add medicine
      </button>
      <MedicineDialogForm mode="create" open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** Per-card Edit / Delete controls. */
export function MedicineCardActions({
  medicine,
}: {
  medicine: { id: number; name: string; strength: string | null; form: string | null; unit: string | null };
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    if (!window.confirm(`Delete "${medicine.name}" from the catalogue? This cannot be undone.`)) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteMedicine(medicine.id);
      if (res.error) setError(res.error);
    });
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-800"
        title="Edit medicine"
      >
        <Pencil className="h-3 w-3" />
        Edit
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={handleDelete}
        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 transition-colors hover:border-rose-200 hover:text-rose-600 disabled:opacity-50"
        title="Delete medicine"
      >
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
        Delete
      </button>
      {error && <p className="mt-1 text-[11px] font-medium text-rose-600">{error}</p>}
      <MedicineDialogForm mode="edit" medicine={medicine} open={editing} onClose={() => setEditing(false)} />
    </div>
  );
}
