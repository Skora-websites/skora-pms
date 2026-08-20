"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteClinic } from "./actions";
import { ClinicEditForm } from "./clinic-edit-form";

type Clinic = {
  id: number;
  clinicName: string;
  addressType: "manual" | "map" | null;
  address: string;
  latitude: string | null;
  longitude: string | null;
  phone: string;
  consultationFee: string | null;
  clinicLogo: string | null;
  isActive: boolean | null;
};

export function ClinicCardActions({ clinic }: { clinic: Clinic }) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setBusy(true);
    await deleteClinic(clinic.id);
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
            confirming
              ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
              : "border-slate-200 text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {confirming ? "Confirm?" : "Delete"}
        </button>
      </div>

      {editOpen && <ClinicEditForm clinic={clinic} onClose={() => setEditOpen(false)} />}
    </>
  );
}