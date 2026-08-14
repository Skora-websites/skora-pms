"use client";

import { useTransition } from "react";
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

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm(`Delete patient "${patientName}"?\n\nThis will permanently remove the patient and their linked records. This cannot be undone.`)) {
          startTransition(async () => {
            await deletePatient(patientId);
          });
        }
      }}
      className="btn-secondary !py-2 text-xs !text-red-600 hover:!border-red-200 hover:!bg-red-50"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {pending ? "Deleting..." : "Delete"}
    </button>
  );
}