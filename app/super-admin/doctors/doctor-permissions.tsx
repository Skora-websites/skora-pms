"use client";

import { useState } from "react";
import { KeyRound, Loader2, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAllPermissions, getUserPermissionNames } from "@/app/doctor/roles/actions";
import { saveDoctorPermissions } from "../actions";

export function DoctorPermissionsDialog({
  doctorId,
  doctorName,
}: {
  doctorId: number;
  doctorName: string;
}) {
  const [open, setOpen] = useState(false);
  const [modules, setModules] = useState<Awaited<ReturnType<typeof getAllPermissions>> | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const router = useRouter();

  async function openDialog() {
    setOpen(true);
    setMsg(null);
    setLoading(true);
    try {
      const [mods, names] = await Promise.all([getAllPermissions(), getUserPermissionNames(doctorId)]);
      setModules(mods);
      setChecked(new Set(names));
    } catch {
      setMsg({ type: "err", text: "Could not load permissions." });
    } finally {
      setLoading(false);
    }
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
    setSaving(true);
    setMsg(null);
    const res = await saveDoctorPermissions(doctorId, Array.from(checked));
    setSaving(false);
    if (res.error) setMsg({ type: "err", text: res.error });
    else {
      setMsg({ type: "ok", text: "Permissions saved for " + doctorName });
      router.refresh();
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={openDialog}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
      >
        <KeyRound className="h-3.5 w-3.5" />
        Permissions
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => setOpen(false)}>
      <div
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Permissions · {doctorName}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Module-level grants that apply across this doctor&apos;s practice.
            </p>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {msg && (
          <p
            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
              msg.type === "ok" ? "border-accent-200 bg-accent-50 text-accent-800" : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {msg.text}
          </p>
        )}

        {loading || !modules ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading permissions…
          </div>
        ) : (
          <div className="mt-4 max-h-96 space-y-3 overflow-y-auto rounded-2xl border border-slate-200 p-3">
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
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="btn-primary disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save permissions"}
          </button>
        </div>
      </div>
    </div>
  );
}