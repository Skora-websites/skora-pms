"use client";

import { useActionState } from "react";
import { Shield, Lock } from "lucide-react";
import { updateProfileAction, type ProfileState } from "../profile/actions";

const initialState = { error: null as string | null };

export function SecuritySettings() {
  const [state, formAction, pending] = useActionState(
    async (_state: ProfileState, formData: FormData) => updateProfileAction(formData),
    initialState
  );

  return (
    <div>
      <h2 className="font-display text-base font-bold text-slate-900">Security</h2>
      <p className="mt-1 text-xs text-slate-400">Change your password or update your security settings.</p>

      <form action={formAction} className="mt-5 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="current_password" className="label">Current password</label>
            <input
              id="current_password"
              name="current_password"
              type="password"
              className="input"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label htmlFor="new_password" className="label">New password</label>
            <input
              id="new_password"
              name="new_password"
              type="password"
              minLength={8}
              className="input"
              placeholder="At least 8 characters"
            />
          </div>
        </div>

        <div>
          <label htmlFor="name" className="label">Full name</label>
          <input id="name" name="name" className="input" placeholder="Your full name" />
        </div>
        <div>
          <label htmlFor="phone" className="label">Phone</label>
          <input id="phone" name="phone" className="input" placeholder="Phone number" />
        </div>

        {state.error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="btn-primary !py-2.5 text-sm"
        >
          <Lock className="h-4 w-4" />
          {pending ? "Saving…" : "Update security settings"}
        </button>
      </form>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/60 p-5">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-brand-700" />
          <div>
            <h4 className="font-semibold text-slate-900">Two-factor authentication</h4>
            <p className="text-sm text-slate-500">
              Two-factor authentication adds an extra layer of security to your account.
            </p>
            <button className="mt-2 text-sm font-medium text-brand-700 hover:underline">
              Configure 2FA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}