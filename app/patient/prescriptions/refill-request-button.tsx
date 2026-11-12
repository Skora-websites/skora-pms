"use client";

import { useState } from "react";
import { useActionState } from "react";
import { RefreshCw } from "lucide-react";
import { requestPrescriptionRefill, type RefillRequestState } from "./actions";

const initialState: RefillRequestState = { error: null, success: false };

export function RefillRequestButton({
  consultationId,
  medications,
}: {
  consultationId: number;
  medications: Array<{ medicineName: string; dose: string | null; frequency: string | null }>;
}) {
  const [state, formAction, pending] = useActionState(requestPrescriptionRefill, initialState);
  const [open, setOpen] = useState(false);

  if (state.success) {
    return (
      <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
        ✓ Refill request submitted.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-brand-700 border border-brand-200 rounded-lg px-3 py-2 hover:bg-brand-50 flex items-center gap-1.5"
      >
        <RefreshCw className="h-3.5 w-3.5" /> Request refill
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="consultation_id" value={consultationId} />
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Medication</label>
        <select name="medication_name" className="input text-sm w-full">
          <option value="">All medications</option>
          {medications.map((m, i) => (
            <option key={i} value={m.medicineName}>
              {m.medicineName}
              {m.dose ? ` (${m.dose})` : ""}
              {m.frequency ? ` - ${m.frequency}` : ""}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Quantity needed</label>
        <input
          type="number"
          name="quantity"
          min={1}
          defaultValue={1}
          className="input text-sm w-24"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">Note (optional)</label>
        <textarea
          name="note"
          rows={2}
          className="input text-sm w-full"
          placeholder="Any additional info for your doctor..."
        />
      </div>
      {state.error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="text-xs bg-brand-700 text-white rounded-lg px-3 py-2 hover:bg-brand-800 disabled:opacity-50"
        >
          {pending ? "Submitting..." : "Submit request"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-slate-600 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}