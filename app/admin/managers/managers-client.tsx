"use client";

import { useActionState } from "react";
import { assignManager, createManager, unassignManager, type ActionResult } from "./actions";
import { ManagerPermissionsEditor, type ManagerModuleCatalog } from "./permissions-editor";

const initial: ActionResult = { error: null };

function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{error}</p>
  );
}

export function ManagerForm({
  clinics,
  managerUsers,
}: {
  clinics: { id: number; clinicName: string }[];
  managerUsers: { id: number; name: string; email: string }[];
}) {
  const [assignState, assignAction, assignPending] = useActionState(assignManager, initial);
  const [createState, createAction, createPending] = useActionState(createManager, initial);

  return (
    <div className="mb-6 grid gap-4 lg:grid-cols-2">
      {/* Create manager account */}
      <div className="card p-6">
        <h2 className="text-[15px] font-semibold text-ink">New manager account</h2>
        <p className="mt-1 text-xs text-slate-400">
          Creates a `manager`-role user. Assign them to a clinic below.
        </p>
        <form action={createAction} className="mt-4 space-y-3">
          <input name="name" required placeholder="Full name" className="input w-full" />
          <input name="email" type="email" required placeholder="Email" className="input w-full" />
          <input name="phone" placeholder="Phone (optional)" className="input w-full" />
          <input
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Temporary password (min 8 chars)"
            className="input w-full"
          />
          <button type="submit" disabled={createPending} className="btn-primary w-full">
            {createPending ? "Creating…" : "Create manager"}
          </button>
          <ErrorNote error={createState.error} />
        </form>
      </div>

      {/* Assign to clinic */}
      <div className="card p-6">
        <h2 className="text-[15px] font-semibold text-ink">Assign to clinic</h2>
        <p className="mt-1 text-xs text-slate-400">
          The manager will only see data for the clinics assigned here.
        </p>
        <form action={assignAction} className="mt-4 space-y-3">
          <select name="userId" required className="input w-full" defaultValue="">
            <option value="" disabled>
              Select manager
            </option>
            {managerUsers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.email})
              </option>
            ))}
          </select>
          <select name="clinicId" required className="input w-full" defaultValue="">
            <option value="" disabled>
              Select clinic
            </option>
            {clinics.map((c) => (
              <option key={c.id} value={c.id}>
                {c.clinicName}
              </option>
            ))}
          </select>
          <button type="submit" disabled={assignPending} className="btn-primary w-full">
            {assignPending ? "Assigning…" : "Assign manager"}
          </button>
          <ErrorNote error={assignState.error} />
        </form>
      </div>
    </div>
  );
}

export function ManagerList({
  assignments,
  catalog,
  permsByManagerId,
}: {
  assignments: {
    id: number;
    managerId: number;
    managerName: string;
    managerEmail: string | null;
    clinicName: string;
    isActive: boolean;
    createdAt: Date | null;
  }[];
  catalog: ManagerModuleCatalog;
  permsByManagerId: Map<number, Set<string>>;
}) {
  const [, unassignAction, unassignPending] = useActionState(unassignManager, initial);

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">
          Current assignments
        </h2>
      </div>
      <div className="divide-y divide-slate-50">
        {assignments.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-3 px-6 py-3.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {a.managerName}
                {!a.isActive && (
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-400">
                    Removed
                  </span>
                )}
              </p>
              <p className="truncate text-xs text-slate-400">
                {a.clinicName} · {a.managerEmail}
              </p>
            </div>
            {a.isActive && (
              <div className="flex items-center gap-2">
                <ManagerPermissionsEditor
                  managerId={a.managerId}
                  managerName={a.managerName}
                  catalog={catalog}
                  granted={permsByManagerId.get(a.managerId) ?? new Set<string>()}
                />
                <form action={unassignAction}>
                  <input type="hidden" name="assignmentId" value={a.id} />
                  <button
                    type="submit"
                    disabled={unassignPending}
                    className="text-xs font-semibold text-rose-600 hover:underline disabled:opacity-50"
                  >
                    Remove
                  </button>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
