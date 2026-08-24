"use client";

import { useTransition, useState } from "react";
import { Trash2 } from "lucide-react";
import { deletePatient } from "../actions";

export function DeletePatientButton({
  patientId,
  patientName,
}: {
  patientId: number;
  patientName: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      {error && (
        <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          if (confirm(`Delete patient "${patientName}"?\n\nThis will permanently remove the patient. This cannot be undone.`)) {
            startTransition(async () => {
              const result = await deletePatient(patientId);
              if (result?.error) setError(result.error);
            });
          }
        }}
        className="btn-secondary !py-2 text-xs !text-red-600 hover:!border-red-200 hover:!bg-red-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {pending ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}