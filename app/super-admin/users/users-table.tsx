"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Plus, ShieldCheck, UserCheck, UserX, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { storeUser, toggleUserStatus, updateUser } from "../actions";
import { StatusBadge } from "@/components/ui/dashboard-ui";
import { UsersList } from "@/components/mobile-view/users-list";
import { formatDate, initials } from "@/lib/utils";

const initialState = { error: null as string | null };

const ROLES = ["doctor", "patient", "receptionist", "admin", "super_admin"] as const;

type UserRow = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string | null;
  trialEndsAt?: string | null;
};

function UserForm({
  user,
  onDone,
}: {
  user?: UserRow | null;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(user ? updateUser : storeUser, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state !== initialState && state.error === null) {
      router.refresh();
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onDone}>
      <div
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              {user ? `Edit user: ${user.name}` : "Create user"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">Accounts created here can sign in immediately.</p>
          </div>
          <button type="button" onClick={onDone} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={formAction} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {user && <input type="hidden" name="id" value={user.id} />}
          <div className="sm:col-span-2">
            <label htmlFor="user_name" className="label">Full name</label>
            <input id="user_name" name="name" required maxLength={255} defaultValue={user?.name ?? ""} className="input" />
          </div>
          <div>
            <label htmlFor="user_email" className="label">Email</label>
            <input id="user_email" name="email" type="email" required maxLength={255} defaultValue={user?.email ?? ""} className="input" />
          </div>
          <div>
            <label htmlFor="user_phone" className="label">Phone</label>
            <input id="user_phone" name="phone" maxLength={20} defaultValue={user?.phone ?? ""} className="input" />
          </div>
          <div>
            <label htmlFor="user_password" className="label">
              Password {user ? "(leave blank to keep)" : ""}
            </label>
            <input
              id="user_password"
              name="password"
              type="password"
              required={!user}
              minLength={8}
              className="input"
              placeholder="Min 8 characters"
            />
          </div>
          <div>
            <label htmlFor="user_role" className="label">Role</label>
            <select id="user_role" name="role" defaultValue={user?.role ?? "doctor"} className="input capitalize">
              {ROLES.map((r) => (
                <option key={r} value={r} className="capitalize">{r.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="user_status" className="label">Status</label>
            <select id="user_status" name="status" defaultValue={user?.status ?? "active"} className="input">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label htmlFor="user_qualification" className="label">Qualification</label>
            <input id="user_qualification" name="qualification" maxLength={255} className="input" placeholder="e.g. MBBS, MD" />
          </div>
          <div>
            <label htmlFor="user_reg_number" className="label">Registration number</label>
            <input id="user_reg_number" name="registration_number" maxLength={255} className="input" />
          </div>
          {(user?.role === "doctor") && (
            <div className="sm:col-span-2">
              <label htmlFor="user_trial" className="label">Trial ends on (doctors)</label>
              <input
                id="user_trial"
                name="trial_ends_at"
                type="date"
                defaultValue={user.trialEndsAt ? user.trialEndsAt.slice(0, 10) : undefined}
                className="input"
              />
            </div>
          )}

          {state.error && (
            <p className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2 sm:col-span-2">
            <button type="button" onClick={onDone} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={pending} className="btn-primary disabled:opacity-60">
              <ShieldCheck className="h-4 w-4" />
              {pending ? "Saving…" : user ? "Save user" : "Create user"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function UsersTable({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: number;
}) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const router = useRouter();

  async function handleToggle(user: UserRow) {
    setToggling(user.id);
    setMsg(null);
    const res = await toggleUserStatus(user.id);
    setToggling(null);
    if (res.error) setMsg({ type: "err", text: res.error });
    else {
      setMsg({ type: "ok", text: `${user.name} is now ${user.status === "active" ? "inactive" : "active"}.` });
      router.refresh();
    }
  }

  return (
    <div>
      <div className="mb-5 flex justify-end">
        <button type="button" onClick={() => setCreating(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          New user
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

      {/* Mobile: card list */}
      <UsersList
        users={users}
        currentUserId={currentUserId}
        onEdit={setEditing}
        onToggle={handleToggle}
        toggling={toggling}
      />

      {/* Desktop: table */}
      <div className="hidden sm:block">
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Joined</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-navy-800 to-brand-700 text-xs font-bold text-white">
                      {initials(u.name)}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {u.name}
                        {u.id === currentUserId && <span className="ml-2 text-xs font-medium text-brand-700">(you)</span>}
                      </p>
                      <p className="text-xs text-slate-400">{u.email ?? "—"}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="badge bg-slate-100 capitalize text-slate-700">{u.role.replace(/_/g, " ")}</span>
                </td>
                <td>{u.phone ?? "—"}</td>
                <td><StatusBadge status={u.status} /></td>
                <td>{formatDate(u.createdAt)}</td>
                <td>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(u)}
                      className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:border-brand-300 hover:text-brand-800"
                      aria-label={`Edit ${u.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {u.id !== currentUserId && u.role !== "super_admin" && (
                      <button
                        type="button"
                        onClick={() => handleToggle(u)}
                        disabled={toggling === u.id}
                        className={`rounded-lg border p-2 transition-colors disabled:opacity-50 ${
                          u.status === "active"
                            ? "border-red-200 text-red-600 hover:bg-red-50"
                            : "border-accent-200 text-accent-700 hover:bg-accent-50"
                        }`}
                        aria-label={u.status === "active" ? `Deactivate ${u.name}` : `Activate ${u.name}`}
                      >
                        {u.status === "active" ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>

      {creating && <UserForm onDone={() => setCreating(false)} />}
      {editing && <UserForm user={editing} onDone={() => setEditing(null)} />}
    </div>
  );
}