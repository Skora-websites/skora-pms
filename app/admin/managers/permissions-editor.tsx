"use client";

import { useActionState, useEffect, useState } from "react";
import { KeyRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { saveManagerPermissions, type ActionResult } from "./actions";

const initial: ActionResult = { error: null };

export type ManagerModuleCatalog = {
  id: number;
  name: string;
  children: { id: number; name: string }[];
}[];

function labelize(name: string) {
  return name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Owner-side editor for one manager's module permissions. Mirrors the
 * super-admin DoctorPermissionsDialog interaction: module checkbox implies
 * its children; saving any child implies the module server-side too.
 */
export function ManagerPermissionsEditor({
  managerId,
  managerName,
  catalog,
  granted,
}: {
  managerId: number;
  managerName: string;
  catalog: ManagerModuleCatalog;
  granted: Set<string>;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(saveManagerPermissions, initial);
  const router = useRouter();

  useEffect(() => {
    if (state !== initial && state.error === null) {
      router.refresh();
      close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function close() {
    setOpen(false);
  }

  const moduleCount = granted.size
    ? catalog.filter((m) => granted.has(m.name)).length
    : 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-800"
        title="Edit module permissions"
      >
        <KeyRound className="h-3.5 w-3.5" />
        Permissions{moduleCount > 0 ? ` (${moduleCount})` : ""}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={close}>
          <div
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">
                  Modules for {managerName}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Managers see only the modules you grant here, scoped to their assigned clinics.
                </p>
              </div>
              <button type="button" onClick={close} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={(fd) => { fd.set("managerId", String(managerId)); formAction(fd); }} className="mt-5 space-y-4">
              <div className="space-y-2">
                {catalog.length === 0 && (
                  <p className="text-sm text-slate-400">No delegable modules found in the permission catalog.</p>
                )}
                {catalog.map((m) => (
                  <div key={m.id} className="rounded-xl border border-slate-100 p-3">
                    <label className="flex items-center gap-2.5 text-sm font-semibold text-ink">
                      <input
                        type="checkbox"
                        name="perm"
                        value={m.name}
                        defaultChecked={granted.has(m.name)}
                        className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-600"
                      />
                      {labelize(m.name)}
                    </label>
                    {m.children.length > 0 && (
                      <div className="mt-2 grid gap-1 pl-7 sm:grid-cols-2">
                        {m.children.map((c) => (
                          <label key={c.id} className="flex items-center gap-2 text-xs text-slate-500">
                            <input
                              type="checkbox"
                              name="perm"
                              value={c.name}
                              defaultChecked={granted.has(c.name)}
                              className="h-3.5 w-3.5 rounded border-slate-300 text-brand-700 focus:ring-brand-600"
                            />
                            {c.name}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400">
                Business Settings, Clinics and Managers stay owner-only and cannot be delegated.
              </p>

              {state.error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
              )}
              {state.error === null && state !== initial && (
                <p className="rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-800">
                  Permissions saved.
                </p>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={close} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
                  {pending ? "Saving…" : "Save permissions"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
