"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteRole } from "./actions";
import { RoleForm, type PermissionModule } from "./role-form";

type Role = { id: number; name: string; permissionNames: string[] };

export function RoleCardActions({ role, modules }: { role: Role; modules: PermissionModule[] }) {
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
    const res = await deleteRole(role.id);
    setBusy(false);
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
          title="Edit role"
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
          title={confirming ? "Click again to confirm" : "Delete role"}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {editing && (
        <RoleForm
          role={{ id: role.id, name: role.name }}
          modules={modules}
          initialPermissions={role.permissionNames}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}