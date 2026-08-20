"use client";

import { useState } from "react";
import { KeyRound, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { saveStaffPermissions } from "./actions";
import type { PermissionModule } from "./role-form";

type Receptionist = { id: number; name: string; email: string | null };

export function StaffPermissionManager({
  receptionists,
  modules,
}: {
  receptionists: Receptionist[];
  modules: PermissionModule[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Receptionist | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const router = useRouter();

  function openManager(staff: Receptionist) {
    setSelected(staff);
    setOpen(true);
    setMsg(null);
    setChecked(new Set());
    setLoading(true);
    fetch(`/api/doctor/staff/${staff.id}/permissions`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        setChecked(new Set((data.user_permissions as string[]) ?? []));
      })
      .catch(() => setMsg({ type: "err", text: "Could not load permissions." }))
      .finally(() => setLoading(false));
  }

  function toggle(name: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function toggleModule(moduleName: string, perms: { name: string }[]) {
    setChecked((prev) => {
      const next = new Set(prev);
      const allChecked = perms.every((p) => next.has(p.name));
      for (const p of perms) {
        if (allChecked) next.delete(p.name);
        else next.add(p.name);
      }
      return next;
    });
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    setMsg(null);
    const res = await saveStaffPermissions(selected.id, Array.from(checked));
    setSaving(false);
    if (res.error) setMsg({ type: "err", text: res.error });
    else {
      setMsg({ type: "ok", text: "Permissions saved for " + selected.name });
      router.refresh();
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-6 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-800">
          <KeyRound className="h-4.5 w-4.5" />
        </span>
        <div>
          <h2 className="font-display text-base font-bold text-slate-900">Staff permissions</h2>
          <p className="text-xs text-slate-500">
            Grant or revoke individual permissions for a staff member (overrides role defaults).
          </p>
        </div>
      </div>

      <div className="p-6">
        {!open ? (
          <div className="flex flex-wrap items-center gap-2">
            {receptionists.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => openManager(r)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
              >
                {r.name}
              </button>
            ))}
            {receptionists.length === 0 && (
              <p className="text-sm text-slate-400">Add staff members first to manage their permissions.</p>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">
                Managing: <span className="text-brand-800">{selected?.name}</span>
                {loading && <span className="ml-2 text-xs text-slate-400">loading…</span>}
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {msg && (
              <p
                className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
                  msg.type === "ok" ? "border-accent-200 bg-accent-50 text-accent-800" : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {msg.text}
              </p>
            )}

            <div className="max-h-96 space-y-3 overflow-y-auto rounded-2xl border border-slate-200 p-3">
              {modules.map((m) => (
                <div key={m.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  <div className="flex items-center justify-between">
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-bold capitalize text-slate-800">
                      <input
                        type="checkbox"
                        checked={m.permissions.length > 0 && m.permissions.every((p) => checked.has(p.name))}
                        onChange={() => toggleModule(m.name, m.permissions)}
                        className="h-4 w-4 rounded border-slate-300 accent-brand-700"
                      />
                      {m.name.replace(/-/g, " ")}
                    </label>
                    {m.permissions.length > 0 && (
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        {m.permissions.filter((p) => checked.has(p.name)).length}/{m.permissions.length}
                      </span>
                    )}
                  </div>
                  {m.permissions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.permissions.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggle(p.name)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                            checked.has(p.name)
                              ? "bg-brand-700 text-white"
                              : "border border-slate-200 bg-white text-slate-500 hover:border-brand-200"
                          }`}
                        >
                          {p.name.split("-").slice(1).join(" ") || p.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button type="button" onClick={handleSave} disabled={saving || loading} className="btn-primary disabled:opacity-60">
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : "Save permissions"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}