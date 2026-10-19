"use client";

import { useState, useTransition } from "react";
import { updateProfileAction } from "@/app/doctor/profile/actions";
import { cn } from "@/lib/utils";

type Props = {
  user: {
    name: string;
    email: string;
    phone: string;
    profilePhotoPath: string | null;
    roleLabel: string;
    businessCount: number;
    clinicCount: number;
  };
};

/**
 * NOTE: `updateProfileAction` is role-agnostic (it operates on the session
 * user), so the admin tier reuses the doctor profile action instead of
 * duplicating the password-hashing rules. Now that two route groups import it,
 * docs/architecture/server-actions.md says it belongs in `lib/actions/` — that
 * move is deliberately deferred rather than half-done here.
 */
export function ProfileForm({ user }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  return (
    <form
      action={(formData) => {
        setMessage(null);
        setFailed(false);
        startTransition(async () => {
          const state = await updateProfileAction(formData);
          if (state?.error) {
            setFailed(true);
            setMessage(state.error);
          } else {
            setMessage("Profile updated.");
          }
        });
      }}
      className="max-w-xl space-y-5"
    >
      <div className="flex items-center gap-4">
        {user.profilePhotoPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/doctor/profile/photo`}
            alt=""
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-500">
            {user.name.slice(0, 1) || "?"}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-ink">{user.name || "Unnamed"}</p>
          <p className="text-xs text-ink-muted">
            {user.roleLabel} · {user.clinicCount} clinic{user.clinicCount === 1 ? "" : "s"} ·{" "}
            {user.businessCount} business{user.businessCount === 1 ? "" : "es"}
          </p>
        </div>
      </div>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Name</span>
        <input name="name" defaultValue={user.name} className="input mt-1" required />
      </label>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Email</span>
        <input name="email" value={user.email ?? ""} className="input mt-1" readOnly />
        <span className="mt-1 block text-[11px] text-slate-400">
          Contact the platform admin to change your email.
        </span>
      </label>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Phone</span>
        <input name="phone" defaultValue={user.phone ?? ""} className="input mt-1" />
      </label>

      <details className="rounded-xl border border-slate-200 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-ink">Change password</summary>
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Current password
            </span>
            <input
              name="current_password"
              type="password"
              autoComplete="current-password"
              className="input mt-1"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              New password
            </span>
            <input
              name="new_password"
              type="password"
              autoComplete="new-password"
              className="input mt-1"
            />
          </label>
          <p className="text-[11px] text-slate-400">Minimum 8 characters.</p>
        </div>
      </details>

      {message && (
        <p
          className={cn(
            "text-sm",
            failed ? "text-red-600" : "text-emerald-600"
          )}
          role="status"
        >
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
