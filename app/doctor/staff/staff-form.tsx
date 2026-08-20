"use client";

import { useActionState, useEffect, useState } from "react";
import { Plus, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createStaff, updateStaff } from "./actions";

const initialState = { error: null as string | null };

type Staff = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  status: string | null;
};

type Role = { id: number; name: string };

export function StaffForm({ practiceRoles, staff }: { practiceRoles: Role[]; staff?: Staff | null }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(staff ? updateStaff : createStaff, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state !== initialState && state.error === null) {
      router.refresh();
      close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function close() {
    setOpen(false);
  }

  return (
    <>
      {!staff && (
        <button type="button" onClick={() => setOpen(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          Add staff
        </button>
      )}

      {(open || staff) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={close}>
          <div
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  {staff ? `Edit ${staff.name}` : "Add staff member"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {staff
                    ? "Update details or reset their password."
                    : "They get a login and the permissions of the selected role."}
                </p>
              </div>
              <button type="button" onClick={close} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              action={(fd) => {
                if (staff) fd.set("id", String(staff.id));
                formAction(fd);
              }}
              className="mt-5 space-y-4"
            >
              <div>
                <label htmlFor="name" className="label">Full name</label>
                <input id="name" name="name" required maxLength={255} defaultValue={staff?.name ?? ""} className="input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="email" className="label">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    defaultValue={staff?.email ?? ""}
                    className="input"
                    placeholder="staff@clinic.com"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="label">Phone</label>
                  <input id="phone" name="phone" defaultValue={staff?.phone ?? ""} className="input" placeholder="+91…" />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="label">{staff ? "New password (leave blank to keep)" : "Password"}</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  minLength={staff ? undefined : 8}
                  required={!staff}
                  className="input"
                  placeholder="Min 8 characters"
                />
              </div>
              <div>
                <label htmlFor="role_id" className="label">Role</label>
                <select id="role_id" name="role_id" required className="input">
                  <option value="" disabled>
                    Select role…
                  </option>
                  {practiceRoles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                {practiceRoles.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-700">
                    Create a role first in “Roles & Permission” so staff can be assigned one.
                  </p>
                )}
              </div>

              {state.error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={close} className="btn-ghost">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending || practiceRoles.length === 0}
                  className="btn-primary disabled:opacity-60"
                >
                  <UserPlus className="h-4 w-4" />
                  {pending ? "Saving…" : staff ? "Save changes" : "Add staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}