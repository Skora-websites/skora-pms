"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteStaff } from "./actions";
import { StaffForm } from "./staff-form";

type Staff = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  status: string | null;
};

type Role = { id: number; name: string };

export function StaffActions({ staff, practiceRoles }: { staff: Staff; practiceRoles: Role[] }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    setBusy(true);
    await deleteStaff(staff.id);
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          title="Edit staff"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          className={`rounded-lg p-1.5 transition-colors disabled:opacity-60 ${
            confirming ? "bg-red-50 text-red-600" : "text-slate-400 hover:bg-red-50 hover:text-red-600"
          }`}
          title={confirming ? "Click again to confirm" : "Delete staff"}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {editing && <StaffForm practiceRoles={practiceRoles} staff={staff} />}
    </>
  );
}