"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, ShieldCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createRole, updateRole } from "./actions";

const initialState = { error: null as string | null };

export type PermissionModule = {
  id: number;
  name: string;
  permissions: { id: number; name: string }[];
};

export function RoleForm({
  role,
  modules,
  initialPermissions,
  onClose,
}: {
  role?: { id: number; name: string };
  modules: PermissionModule[];
  initialPermissions?: string[];
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialPermissions ?? []));
  const [state, formAction, pending] = useActionState(role ? updateRole : createRole, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state !== initialState && state.error === null) {
      router.refresh();
      close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function toggleModule(moduleName: string, perms: { name: string }[]) {
    setSelected((prev) => {
      const next = new Set(prev);
      const allChecked = perms.every((p) => next.has(p.name));
      for (const p of perms) {
        if (allChecked) next.delete(p.name);
        else next.add(p.name);
      }
      return next;
    });
  }

  function close() {
    setOpen(false);
    onClose?.();
  }

  return (
    <>
      {!role && (
        <button type="button" onClick={() => setOpen(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          New role
        </button>
      )}

      {(open || role) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={close}>
          <div
            className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  {role ? `Edit role: ${role.name}` : "Create role"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">Pick the modules and actions this role can access.</p>
              </div>
              <button type="button" onClick={close} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              action={(fd) => {
                if (role) fd.set("id", String(role.id));
                fd.set("permissions", Array.from(selected).join(","));
                formAction(fd);
              }}
              className="mt-5 space-y-4"
            >
              <div>
                <label htmlFor="role_name" className="label">Role name</label>
                <input
                  id="role_name"
                  name="name"
                  required
                  maxLength={255}
                  defaultValue={role?.name ?? ""}
                  className="input"
                  placeholder="e.g. Receptionist, Lab Assistant"
                />
              </div>

              <div>
                <label className="label">Permissions</label>
                <div className="max-h-72 space-y-3 overflow-y-auto rounded-2xl border border-slate-200 p-3">
                  {modules.map((m) => (
                    <div key={m.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                      <div className="flex items-center justify-between">
                        <label className="flex cursor-pointer items-center gap-2 text-sm font-bold capitalize text-slate-800">
                          <input
                            type="checkbox"
                            checked={m.permissions.length > 0 && m.permissions.every((p) => selected.has(p.name))}
                            onChange={() => toggleModule(m.name, m.permissions)}
                            className="h-4 w-4 rounded border-slate-300 accent-brand-700"
                          />
                          {m.name.replace(/-/g, " ")}
                        </label>
                        {m.permissions.length > 0 && (
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            {m.permissions.filter((p) => selected.has(p.name)).length}/{m.permissions.length}
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
                                selected.has(p.name)
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
              </div>

              {state.error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={close} className="btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
                  <ShieldCheck className="h-4 w-4" />
                  {pending ? "Saving…" : role ? "Save role" : "Create role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}